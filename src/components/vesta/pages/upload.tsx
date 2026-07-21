import { useState, useEffect } from "react";
import { type LocalSnapshot, type RFAtivo, STORAGE_KEYS } from "@/data/vesta-users";
import { supabase } from "@/integrations/supabase/client";
import { detectarBanco, processarArquivo, parsearPDF, type AtivoImportado } from "@/lib/bankParsers";

type ParsedClasse = "RF" | "ACAO" | "FII" | "FIAGRO" | "ETF" | "FUNDO" | "PREVIDENCIA" | "COE" | "RV";
type ParsedRow = {
  ativo: string;
  valor: number;
  taxa?: string;
  rentabilidadeBruta?: string;
  venc?: string;
  aplicado?: number;
  precoMedio?: string;
  ultimaCotacao?: string;
  quantidade?: string;
  classe?: ParsedClasse;
  secao?: string;
};
type ParsedProvento = {
  ticker: string;
  classe: "Ação" | "FII" | "FI-Agro" | "ETF";
  valor: number;
  evento?: string;
  dataPagamento?: string;
};
type ParsedFile = { rows: ParsedRow[]; proventos?: ParsedProvento[]; dataRef?: string; snapshot?: LocalSnapshot };
type AccountId = string;
type EvolutionEntry = {
  id: string;
  accountId: AccountId;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataRef: string;
  savedAt: string;
  total: number;
  rf: number;
  rv: number;
  rfCount: number;
  rvCount: number;
  classBreakdown: Record<string, number>;
  storagePaths?: string[];
};

function normalizeAccountId(accountId: AccountId): AccountId {
  return accountId.startsWith("member:") ? accountId.slice("member:".length) : accountId;
}

function storageKey(accountId: AccountId): string {
  const normalized = normalizeAccountId(accountId);
  if (normalized === "paulo" || normalized === "cinthia") return STORAGE_KEYS[normalized];
  return "vesta_posicao_" + normalized;
}

function evolutionKey(accountId: AccountId): string {
  return "vesta_evolucao_" + normalizeAccountId(accountId);
}

function loadEvolution(accountId: AccountId | null): EvolutionEntry[] {
  if (!accountId || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(evolutionKey(accountId));
    const rows = raw ? JSON.parse(raw) as EvolutionEntry[] : [];
    return rows.sort((a, b) => b.dataRef.localeCompare(a.dataRef) || b.savedAt.localeCompare(a.savedAt));
  } catch {
    return [];
  }
}

function saveEvolution(accountId: AccountId, entry: EvolutionEntry): EvolutionEntry[] {
  const previous = loadEvolution(accountId).filter((item) => item.id !== entry.id);
  const next = [entry, ...previous].sort((a, b) => b.dataRef.localeCompare(a.dataRef) || b.savedAt.localeCompare(a.savedAt));
  window.localStorage.setItem(evolutionKey(accountId), JSON.stringify(next));
  return next;
}

function openArchiveDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("vesta-arquivos-originais", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function archiveOriginalFile(entry: EvolutionEntry, file: File): Promise<void> {
  const db = await openArchiveDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put({ ...entry, blob: file });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function downloadArchivedFile(id: string): Promise<void> {
  const db = await openArchiveDb();
  const record = await new Promise<any>((resolve, reject) => {
    const tx = db.transaction("files", "readonly");
    const req = tx.objectStore("files").get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (!record?.blob) throw new Error("Arquivo original nao encontrado neste navegador.");
  const url = URL.createObjectURL(record.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = record.fileName ?? "extrato-vesta";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error("Arquivo vazio ou sem cabeçalho.");
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase());
  const iAtivo = headers.findIndex((h) => /ativo|papel|t.?tulo|produto/.test(h));
  const iValor = headers.findIndex((h) => /valor|posi.?.?o|montante|saldo|bruto/.test(h));
  const iTaxa = headers.findIndex((h) => /taxa|rentab|indexador/.test(h));
  const iVenc = headers.findIndex((h) => /venc|maturidade|resgate/.test(h));
  if (iAtivo < 0 || iValor < 0)
    throw new Error("Cabeçalhos não reconhecidos. Precisa ter coluna de 'Ativo' e 'Valor'.");
  return lines
    .slice(1)
    .map((line) => {
      const c = line.split(sep);
      const raw = (c[iValor] ?? "").replace(/[R$\s.]/g, "").replace(",", ".");
      return {
        ativo: (c[iAtivo] ?? "").trim(),
        valor: Number(raw) || 0,
        taxa: iTaxa >= 0 ? c[iTaxa]?.trim() || undefined : undefined,
        venc: iVenc >= 0 ? c[iVenc]?.trim() || undefined : undefined,
      };
    })
    .filter((r) => r.ativo && r.valor > 0);
}

function isRF(row: ParsedRow): boolean {
  return row.classe === "RF" || !!(row.venc && row.taxa);
}

function classLabel(row: ParsedRow): string {
  switch (row.classe) {
    case "ACAO": return "acao";
    case "FII": return "FII";
    case "FIAGRO": return "FI-Agro";
    case "ETF": return "ETF";
    case "FUNDO": return "fundo";
    case "PREVIDENCIA": return "previdencia";
    case "COE": return "COE";
    case "RF": return "renda fixa";
    default: return "RV";
  }
}

function toRFAtivo(row: ParsedRow): RFAtivo {
  return {
    n: row.ativo,
    v: row.valor,
    t: null,
    cdi: null,
    venc: row.venc ?? "-",
    s: "monitorar",
    nota: [
      row.taxa ? `Rentabilidade XP: ${row.taxa}` : null,
      row.rentabilidadeBruta ? `Bruta: ${row.rentabilidadeBruta}` : null,
      row.aplicado ? `Aplicado: R$ ${Math.round(row.aplicado).toLocaleString("pt-BR")}` : null,
    ].filter(Boolean).join(" - ") || undefined,
  };
}

function toRVAtivo(row: ParsedRow) {
  return {
    n: row.ativo,
    v: "R$ " + Math.round(row.valor).toLocaleString("pt-BR"),
    pm: [
      row.precoMedio ? `PM ${row.precoMedio}` : null,
      row.ultimaCotacao ? `Cot. ${row.ultimaCotacao}` : null,
      row.quantidade ? `${row.quantidade} cotas` : null,
    ].filter(Boolean).join(" - ") || (row.aplicado ? `Aplicado R$ ${Math.round(row.aplicado).toLocaleString("pt-BR")}` : "Importado XP"),
    r: row.taxa ?? row.rentabilidadeBruta ?? "-",
    rc: row.taxa?.trim().startsWith("-") || row.rentabilidadeBruta?.trim().startsWith("-") ? "bad" : "neutral",
    cls: classLabel(row),
    sb: "sb-a",
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtDateBR(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function moneyToNumber(value: string): number {
  const cleaned = value.replace(/[R$\s.]/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  return Number(cleaned) || 0;
}

function dateBRToISO(value: string): string | undefined {
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return undefined;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function classifyRow(section: string, ativo: string): ParsedClasse {
  const sectionKey = normalizeLabel(section);
  const ativoKey = normalizeLabel(ativo);
  const listedCode = ativo.match(/\b[A-Z]{4}\d{1,2}\b/i)?.[0]?.toUpperCase();
  if (/tesouro|renda fixa|pos-fixado|prefixado|inflacao/.test(sectionKey)) return "RF";
  if (/previdencia/.test(sectionKey)) return "PREVIDENCIA";
  if (/coe/.test(sectionKey)) return "COE";
  if (/fundos imobiliarios/.test(sectionKey)) return /agro|fiagro|xpag/.test(ativoKey) ? "FIAGRO" : "FII";
  if (/fundos de investimentos/.test(sectionKey)) return "FUNDO";
  if (/etf/.test(sectionKey) || /ivvb|bova|smal|gold|nasd|lftb/.test(ativoKey)) return "ETF";
  if (/acoes/.test(sectionKey) || /\b[A-Z]{4}\d{1,2}\b/i.test(ativo)) {
    if (listedCode?.endsWith("11") && /xpag|tgre|hglg|knri|mxrf|xpml|fii|fiagro/.test(ativoKey)) {
      return /agro|fiagro|xpag/.test(ativoKey) ? "FIAGRO" : "FII";
    }
    return "ACAO";
  }
  return "RV";
}

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Este navegador não consegue descompactar XLSX. Exporte em CSV/TXT ou use Chrome/Edge atualizado.");
  }
  const stream = new Blob([bytes as unknown as ArrayBuffer]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function readU16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

function readU32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

async function unzipXlsx(buffer: ArrayBuffer): Promise<Map<string, string>> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (readU32(view, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("XLSX inválido: diretório central não encontrado.");

  const totalEntries = readU16(view, eocd + 10);
  let centralOffset = readU32(view, eocd + 16);
  const decoder = new TextDecoder("utf-8");
  const files = new Map<string, string>();

  for (let i = 0; i < totalEntries; i++) {
    if (readU32(view, centralOffset) !== 0x02014b50) break;
    const method = readU16(view, centralOffset + 10);
    const compressedSize = readU32(view, centralOffset + 20);
    const fileNameLength = readU16(view, centralOffset + 28);
    const extraLength = readU16(view, centralOffset + 30);
    const commentLength = readU16(view, centralOffset + 32);
    const localOffset = readU32(view, centralOffset + 42);
    const name = decoder.decode(bytes.slice(centralOffset + 46, centralOffset + 46 + fileNameLength));

    const localNameLength = readU16(view, localOffset + 26);
    const localExtraLength = readU16(view, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);

    if (name.endsWith(".xml")) {
      const content = method === 0 ? compressed : method === 8 ? await inflateRaw(compressed) : null;
      if (content) files.set(name, decoder.decode(content));
    }

    centralOffset += 46 + fileNameLength + extraLength + commentLength;
  }

  return files;
}

function cellText(cell: Element, sharedStrings: string[]): string {
  const type = cell.getAttribute("t");
  if (type === "inlineStr") {
    return Array.from(cell.getElementsByTagName("t")).map((t) => t.textContent ?? "").join("");
  }
  const raw = cell.getElementsByTagName("v")[0]?.textContent ?? "";
  if (type === "s") return sharedStrings[Number(raw)] ?? "";
  return raw;
}

function colIndex(ref: string): number {
  const letters = ref.replace(/[^A-Z]/gi, "").toUpperCase();
  return letters.split("").reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function rowsFromSheetXml(sheetXml: string, sharedXml?: string): string[][] {
  const parser = new DOMParser();
  const sharedStrings = sharedXml
    ? Array.from(parser.parseFromString(sharedXml, "application/xml").getElementsByTagName("si")).map((si) =>
        Array.from(si.getElementsByTagName("t")).map((t) => t.textContent ?? "").join(""),
      )
    : [];
  const sheet = parser.parseFromString(sheetXml, "application/xml");
  return Array.from(sheet.getElementsByTagName("row")).map((row) => {
    const cells: string[] = [];
    Array.from(row.getElementsByTagName("c")).forEach((cell) => {
      const ref = cell.getAttribute("r") ?? "";
      cells[colIndex(ref)] = cellText(cell, sharedStrings).trim();
    });
    return cells;
  });
}

async function parseXlsx(file: File): Promise<ParsedFile> {
  const files = await unzipXlsx(await file.arrayBuffer());
  const sheetXml = files.get("xl/worksheets/sheet1.xml");
  if (!sheetXml) throw new Error("XLSX sem planilha principal reconhecida.");
  const rows = rowsFromSheetXml(sheetXml, files.get("xl/sharedStrings.xml"));
  let section = "";
  let header: string[] | null = null;
  let dataRef: string | undefined;
  const parsed: ParsedRow[] = [];
  const proventos: ParsedProvento[] = [];

  for (const row of rows) {
    const first = row[0]?.trim() ?? "";
    const joined = row.filter(Boolean).join(" ");
    dataRef ||= dateBRToISO(joined);

    const firstKey = normalizeLabel(first);
    if (/fundos de investimentos|fundos imobiliarios|tesouro direto|renda fixa|acoes|coe|previdencia/.test(firstKey)) {
      section = first;
      header = null;
      continue;
    }
    if (row.some((cell) => normalizeLabel(cell) === "posicao" || normalizeLabel(cell) === "provisionado")) {
      header = row.map((cell) => cell.toLowerCase());
      continue;
    }
    if (!header || !first || first === " ") continue;

    const normalizedHeader = header.map(normalizeLabel);
    const isProvisionedHeader = normalizedHeader.some((cell) => /provisionado|evento|previsao pagamento/.test(cell));
    const effectiveIndex = (index: number) => index;
    const cellAt = (index: number) => {
      const actual = effectiveIndex(index);
      return actual >= 0 ? row[actual] || undefined : undefined;
    };
    const headerIndex = (pattern: RegExp) => normalizedHeader.findIndex((cell) => pattern.test(cell));
    const valorIndex = headerIndex(/posicao|valor liquido|saldo bruto/);
    const vencIndex = headerIndex(/vencimento/);
    const taxaIndex = headerIndex(/rentabilidade liquida|rentabilidade c\/ proventos|taxa|indexador/);
    const taxaBrutaIndex = headerIndex(/rentabilidade bruta/);
    const aplicadoIndex = headerIndex(/valor aplicado|total aplicado/);
    const precoMedioIndex = headerIndex(/preco medio/);
    const cotacaoIndex = headerIndex(/ultima cotacao/);
    const quantidadeIndex = headerIndex(/quantidade|qtd/);
    if (isProvisionedHeader) {
      const provisionadoIndex = headerIndex(/valor provisionado liquido|valor provisionado bruto|provisionado/);
      const eventoIndex = headerIndex(/evento/);
      const pagamentoIndex = headerIndex(/previsao pagamento/);
      const valorProvento = moneyToNumber(cellAt(provisionadoIndex) ?? "");
      if (valorProvento > 0) {
        const classe = classifyRow(section, first);
        proventos.push({
          ticker: first,
          classe: classe === "FIAGRO" ? "FI-Agro" : classe === "FII" ? "FII" : classe === "ETF" ? "ETF" : "Ação",
          valor: valorProvento,
          evento: cellAt(eventoIndex),
          dataPagamento: cellAt(pagamentoIndex),
        });
      }
      continue;
    }
    const valor = moneyToNumber(cellAt(valorIndex) ?? "");
    if (!valor) continue;

    parsed.push({
      ativo: first,
      valor,
      venc: cellAt(vencIndex),
      taxa: cellAt(taxaIndex),
      rentabilidadeBruta: cellAt(taxaBrutaIndex),
      aplicado: moneyToNumber(cellAt(aplicadoIndex) ?? ""),
      precoMedio: cellAt(precoMedioIndex),
      ultimaCotacao: cellAt(cotacaoIndex),
      quantidade: cellAt(quantidadeIndex),
      classe: classifyRow(section, first),
      secao: section,
    });
  }

  return { rows: parsed, proventos, dataRef };
}

function storageAccountSegment(accountId: AccountId): string {
  return accountId.replace(/^member:/, "").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80) || "sem-conta";
}

function safeFileName(fileName: string): string {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "extrato-vesta";
}

async function uploadOriginalFilesToStorage(accountId: AccountId, dataRef: string, files: File[]): Promise<string[]> {
  const { data } = await supabase.auth.getUser();
  if (!data.user || files.length === 0) return [];

  const month = dataRef.slice(0, 7) || new Date().toISOString().slice(0, 7);
  const accountSegment = storageAccountSegment(accountId);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const uploaded: string[] = [];

  for (const [index, file] of files.entries()) {
    const path = `${accountSegment}/${month}/${stamp}-${index + 1}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage
      .from("xp-extratos")
      .upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (error) throw error;
    uploaded.push(path);
  }

  return uploaded;
}

function tipoToClasse(tipo: string): ParsedClasse {
  switch (tipo) {
    case "Previdência": return "PREVIDENCIA";
    case "FIA": return "ACAO";
    case "FII": return "FII";
    case "Fundo RV":
    case "Fundo RF": return "FUNDO";
    case "COE": return "COE";
    default: return "RF";
  }
}

function ativoImportadoToRow(a: AtivoImportado): ParsedRow {
  return {
    ativo: a.nome,
    valor: a.valor,
    taxa: a.taxa || undefined,
    venc: a.vencimento || undefined,
    classe: tipoToClasse(a.tipo),
    rentabilidadeBruta: a.rentab12m || undefined,
    secao: a.banco,
  };
}

async function parseInputFile(file: File): Promise<ParsedFile> {
  if (/\.xls$/i.test(file.name)) {
    throw new Error(`"${file.name}" está no formato XLS antigo. No portal XP, exporte em XLSX (Excel 2007+) ou CSV.`);
  }
  if (!/\.(xlsx|csv|txt|json|pdf)$/i.test(file.name)) {
    throw new Error(`"${file.name}": formato não reconhecido. Use XLSX, CSV, PDF ou TXT exportado da XP/BTG/C6/Brasilprev.`);
  }
  if (/\.(json)$/i.test(file.name)) {
    const snapshot = JSON.parse(await file.text()) as LocalSnapshot;
    if (!snapshot.total || !snapshot.data_referencia || !Array.isArray(snapshot.rf_ativos)) {
      throw new Error("JSON Vesta invalido. Precisa ter total, data_referencia e rf_ativos.");
    }
    return { rows: [], snapshot, dataRef: snapshot.data_referencia };
  }
  if (/\.(pdf)$/i.test(file.name)) {
    try {
      const resultado = await parsearPDF(file);
      if (resultado.erros.length > 0 && resultado.ativos.length === 0)
        throw new Error(resultado.erros.join(" | "));
      return { rows: resultado.ativos.map(ativoImportadoToRow) };
    } catch (e) {
      throw new Error(`"${file.name}": ${(e as Error).message}`);
    }
  }
  if (/\.(xlsx)$/i.test(file.name)) {
    try {
      return await parseXlsx(file);
    } catch (e) {
      throw new Error(`"${file.name}": ${(e as Error).message}`);
    }
  }

  // CSV / TXT — detectar banco e usar parser multi-banco
  const texto = await file.text();
  const banco = detectarBanco(file.name, texto);
  if (banco !== "XP" && banco !== "Genérico") {
    const resultado = processarArquivo(file.name, texto);
    if (resultado.erros.length > 0 && resultado.ativos.length === 0)
      throw new Error(resultado.erros.join(" | "));
    return { rows: resultado.ativos.map(ativoImportadoToRow) };
  }
  return { rows: parseCsv(texto) };
}

function rowMergeKey(row: ParsedRow): string {
  return normalizeLabel([row.ativo, row.classe ?? "", row.venc ?? ""].join("|"));
}

function mergeRow(previous: ParsedRow | undefined, next: ParsedRow): ParsedRow {
  if (!previous) return next;
  const winner = next.valor >= previous.valor ? next : previous;
  const other = winner === next ? previous : next;
  return {
    ...other,
    ...winner,
    taxa: winner.taxa ?? other.taxa,
    rentabilidadeBruta: winner.rentabilidadeBruta ?? other.rentabilidadeBruta,
    venc: winner.venc ?? other.venc,
    aplicado: winner.aplicado || other.aplicado,
    precoMedio: winner.precoMedio ?? other.precoMedio,
    ultimaCotacao: winner.ultimaCotacao ?? other.ultimaCotacao,
    quantidade: winner.quantidade ?? other.quantidade,
    secao: winner.secao ?? other.secao,
  };
}

function mergeParsedFiles(parsedFiles: ParsedFile[]): ParsedFile {
  const snapshot = parsedFiles.find((parsed) => parsed.snapshot)?.snapshot;
  if (snapshot) return { rows: [], proventos: [], dataRef: snapshot.data_referencia, snapshot };

  const byAsset = new Map<string, ParsedRow>();
  const proventos = new Map<string, ParsedProvento>();
  let dataRef: string | undefined;

  for (const parsed of parsedFiles) {
    if (parsed.dataRef && (!dataRef || parsed.dataRef > dataRef)) dataRef = parsed.dataRef;
    for (const row of parsed.rows) {
      const key = rowMergeKey(row);
      byAsset.set(key, mergeRow(byAsset.get(key), row));
    }
    for (const p of parsed.proventos ?? []) {
      const key = normalizeLabel([p.ticker, p.evento ?? "", p.dataPagamento ?? "", String(p.valor)].join("|"));
      proventos.set(key, p);
    }
  }

  return {
    rows: Array.from(byAsset.values()).sort((a, b) => b.valor - a.valor),
    proventos: Array.from(proventos.values()),
    dataRef,
  };
}

export function UploadPage({
  targetAccountId,
  targetAccountName,
}: {
  targetAccountId?: AccountId;
  targetAccountName?: string;
} = {}) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [proventos, setProventos] = useState<ParsedProvento[]>([]);
  const [snapshotImportado, setSnapshotImportado] = useState<LocalSnapshot | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [account, setAccount] = useState<AccountId | null>(null);
  const [dataRef, setDataRef] = useState(todayISO());
  const [aplicado, setAplicado] = useState<{ label: string; data: string; key: string } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [history, setHistory] = useState<EvolutionEntry[]>([]);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [storageMsg, setStorageMsg] = useState<string | null>(null);

  useEffect(() => {
    setAccount(targetAccountId ?? null);
  }, [targetAccountId]);

  useEffect(() => {
    setHistory(loadEvolution(account));
  }, [account]);

  async function handleFiles(files: File[]) {
    setErro(null);
    setAplicado(null);
    setArchiveError(null);
    setStorageMsg(null);
    setSelectedFiles(files);
    setNomeArquivo(files.length === 1 ? files[0].name : `${files.length} arquivos XP`);
    try {
      if (files.length === 0) throw new Error("Selecione pelo menos um arquivo XP.");
      const parsed = mergeParsedFiles(await Promise.all(files.map(parseInputFile)));
      if (parsed.snapshot) {
        setSnapshotImportado(parsed.snapshot);
        setRows([]);
        setProventos([]);
        setDataRef(parsed.snapshot.data_referencia);
        return;
      }
      if (parsed.rows.length === 0) throw new Error("Nenhuma linha valida encontrada.");
      setSnapshotImportado(null);
      setRows(parsed.rows);
      setProventos(parsed.proventos ?? []);
      if (parsed.dataRef) setDataRef(parsed.dataRef);
    } catch (e: unknown) {
      setRows([]);
      setProventos([]);
      setSnapshotImportado(null);
      setErro(e instanceof Error ? e.message : "Erro ao ler o arquivo.");
    }
  }

  async function handleFile(file: File) {
    await handleFiles([file]);
  }
  function accountLabel(id: AccountId): string {
    if (id === targetAccountId && targetAccountName) return targetAccountName;
    return "Carteira selecionada";
  }

  async function aplicarAoPainel() {
    if (!account) return;
    if (snapshotImportado) {
      const savedAt = new Date().toISOString();
      const snap: LocalSnapshot = {
        ...snapshotImportado,
        profileId: account,
        saved_at: savedAt,
      };
      const key = storageKey(account);
      window.localStorage.setItem(key, JSON.stringify(snap));
      const entry: EvolutionEntry = {
        id: `${account}-${snap.data_referencia}-${savedAt}`,
        accountId: account,
        fileName: selectedFiles.length === 1 ? selectedFiles[0].name : nomeArquivo,
        fileType: selectedFiles.length === 1 ? selectedFiles[0].type : "application/json",
        fileSize: selectedFiles.reduce((sum, file) => sum + file.size, 0),
        dataRef: snap.data_referencia,
        savedAt,
        total: snap.total,
        rf: snap.rf,
        rv: snap.rv,
        rfCount: snap.rf_ativos.length,
        rvCount: snap.rv_ativos?.length ?? 0,
        classBreakdown: { "renda fixa": snap.rf, "renda variavel": snap.rv },
      };
      setHistory(saveEvolution(account, entry));
      setAplicado({ label: accountLabel(account), data: snap.data_referencia, key });
      return;
    }
    const rfRows = rows.filter(isRF);
    const rvRows = rows.filter((r) => !isRF(r));
    const rf = rfRows.reduce((s, r) => s + r.valor, 0);
    const rv = rvRows.reduce((s, r) => s + r.valor, 0);
    const savedAt = new Date().toISOString();
    const classBreakdown = rows.reduce<Record<string, number>>((acc, row) => {
      const label = classLabel(row);
      acc[label] = (acc[label] ?? 0) + row.valor;
      return acc;
    }, {});
    const snap: LocalSnapshot = {
      profileId: account,
      data_referencia: dataRef,
      saved_at: savedAt,
      total: rf + rv,
      rf,
      rv,
      kpi4_label: proventos.length > 0 ? "Pingados/mês" : undefined,
      kpi4_val: proventos.length > 0 ? fmtR(proventos.reduce((s, p) => s + p.valor, 0)) : undefined,
      kpi4_sub: proventos.length > 0 ? `${proventos.length} pagadores recorrentes` : undefined,
      rf_ativos: rfRows.map(toRFAtivo),
      rv_ativos: rvRows.map(toRVAtivo),
      alertas_list: [
        ...(rfRows.length > 0
          ? [{
              cor: "w" as const,
              titulo: `${rfRows.slice().sort((a, b) => b.valor - a.valor)[0].ativo} concentra a renda fixa`,
              det: `${fmtR(rfRows.slice().sort((a, b) => b.valor - a.valor)[0].valor)} · revisar taxa, liquidez e alternativa de baixo risco.`,
            }]
          : []),
        ...(rvRows.length > 0
          ? [{
              cor: "w" as const,
              titulo: `${rvRows.slice().sort((a, b) => b.valor - a.valor)[0].ativo} pede raio-X`,
              det: `${fmtR(rvRows.slice().sort((a, b) => b.valor - a.valor)[0].valor)} · comparar rentabilidade, pingados e risco da cota.`,
            }]
          : []),
        ...(proventos.length > 0
          ? [{
              cor: "g" as const,
              titulo: "Pingados identificados",
              det: `${fmtR(proventos.reduce((s, p) => s + p.valor, 0))}/mês em ${proventos.length} eventos provisionados.`,
            }]
          : []),
      ],
      proventos: proventos.map((p) => ({
        ticker: p.ticker,
        classe: p.classe,
        valor_posicao: rows.find((r) => r.ativo === p.ticker)?.valor ?? 0,
        provento_mes: p.valor,
        evento: p.evento,
        data_pagamento: p.dataPagamento,
      })),
    };
    const key = storageKey(account);
    window.localStorage.setItem(key, JSON.stringify(snap));
    let storagePaths: string[] = [];
    if (selectedFiles.length > 0) {
      try {
        storagePaths = await uploadOriginalFilesToStorage(account, dataRef, selectedFiles);
        if (storagePaths.length > 0) {
          setStorageMsg(`${storagePaths.length} arquivo(s) original(is) salvo(s) no Supabase Storage.`);
        } else {
          setStorageMsg("Arquivos guardados neste navegador. Para salvar no Supabase Storage, entre com uma conta real.");
        }
      } catch (err) {
        setStorageMsg(`Nao consegui salvar no Supabase Storage: ${(err as Error).message}`);
      }
    }
    const entry: EvolutionEntry = {
      id: `${account}-${dataRef}-${savedAt}`,
      accountId: account,
      fileName: selectedFiles.length === 1 ? selectedFiles[0].name : nomeArquivo,
      fileType: selectedFiles.length === 1 ? selectedFiles[0].type : "mixed/xp",
      fileSize: selectedFiles.reduce((sum, file) => sum + file.size, 0),
      dataRef,
      savedAt,
      total: rf + rv,
      rf,
      rv,
      rfCount: rfRows.length,
      rvCount: rvRows.length,
      classBreakdown,
      storagePaths,
    };
    setHistory(saveEvolution(account, entry));
    if (selectedFiles.length > 0) {
      try {
        await archiveOriginalFile(entry, selectedFiles[0]);
        await Promise.all(selectedFiles.slice(1).map((file, index) =>
          archiveOriginalFile(
            { ...entry, id: `${entry.id}-${index + 2}`, fileName: file.name, fileType: file.type, fileSize: file.size },
            file,
          )
        ));
      } catch (err) {
        setArchiveError((err as Error).message || "Nao consegui arquivar o arquivo original neste navegador.");
      }
    }
    setAplicado({ label: accountLabel(account), data: dataRef, key });
  }

  const fmtR = (n: number) => "R$ " + Math.round(n).toLocaleString("pt-BR");
  const fmtDelta = (n: number) => {
    const sign = n > 0 ? "+" : "";
    return sign + fmtR(n);
  };
  const rfRows = rows.filter(isRF);
  const rvRows = rows.filter((r) => !isRF(r));
  const rfTotal = rfRows.reduce((s, r) => s + r.valor, 0);
  const rvTotal = rvRows.reduce((s, r) => s + r.valor, 0);

  // Opções de conta disponíveis para seleção
  const accountOptions: AccountId[] = targetAccountId ? [targetAccountId] : [];
  const isConsolidatedTarget =
    !targetAccountId || targetAccountId === "familiar" || targetAccountId.startsWith("domus:");

  return (
    <>
      <div className="ph">
        <h1>Importar posição</h1>
        <p>
          Suba o extrato da XP (PDF ou XLSX/CSV), BTG, C6 Bank ou Brasilprev. Após aplicar, todos os simuladores passam a
          usar os dados do arquivo automaticamente.
        </p>
      </div>

      {isConsolidatedTarget && (
        <div className="alert-full w" style={{ marginBottom: 14 }}>
          <div className="alert-full-hdr"><strong>Abra uma carteira individual</strong></div>
          <div className="alert-full-body">
            O consolidado do Domus é calculado automaticamente. Para importar, abra a carteira do membro, por exemplo Murilo, e suba o arquivo por lá.
          </div>
        </div>
      )}

      {aplicado && (
        <div
          style={{
            background: "rgba(74,124,89,.12)",
            border: "1px solid rgba(74,124,89,.35)",
            borderRadius: "var(--radius)",
            padding: "14px 18px",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--good, #4E7A5C)", marginBottom: 4 }}>
            ✓ Posição de {aplicado.label} atualizada em {fmtDateBR(aplicado.data)}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            Abra qualquer página do painel — os números já refletem o arquivo importado.
          </div>
          <button
            onClick={() => {
              window.localStorage.removeItem(aplicado.key);
              setAplicado(null);
            }}
            style={{
              marginTop: 10,
              fontSize: 12,
              padding: "4px 12px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,.2)",
              borderRadius: 6,
              color: "var(--muted)",
              cursor: "pointer",
            }}
          >
            Desfazer (volta aos dados anteriores)
          </button>
        </div>
      )}

      <div
        className={"drop-zone" + (drag ? " over" : "")}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const files = Array.from(e.dataTransfer.files);
          if (files.length > 0 && !isConsolidatedTarget) handleFiles(files);
        }}
        style={{
          marginBottom: 14,
          opacity: isConsolidatedTarget ? 0.5 : 1,
          pointerEvents: isConsolidatedTarget ? "none" : "auto",
        }}
      >
        <div style={{ fontSize: 15, marginBottom: 6 }}>📥 Arraste os arquivos aqui</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
          XP (PDF, XLSX ou CSV), BTG, C6 Bank, Brasilprev — ou um JSON Vesta para aplicar direto.
        </div>
        <input
          type="file"
          accept=".xlsx,.csv,.txt,.json,.pdf"
          multiple
          disabled={isConsolidatedTarget}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0 && !isConsolidatedTarget) handleFiles(files);
          }}
          style={{ fontSize: 12 }}
        />
      </div>

      {erro && (
        <div className="alert-full r" style={{ marginBottom: 14 }}>
          <div className="alert-full-hdr"><strong>Erro na leitura</strong></div>
          <div className="alert-full-body">{erro}</div>
        </div>
      )}

      {archiveError && (
        <div className="alert-full w" style={{ marginBottom: 14 }}>
          <div className="alert-full-hdr"><strong>Arquivo original nao arquivado</strong></div>
          <div className="alert-full-body">{archiveError}</div>
        </div>
      )}

      {storageMsg && (
        <div className="alert-full w" style={{ marginBottom: 14 }}>
          <div className="alert-full-hdr"><strong>Supabase Storage</strong></div>
          <div className="alert-full-body">{storageMsg}</div>
        </div>
      )}

      {!isConsolidatedTarget && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-hdr">
            Evolucao e arquivos originais <span>{history.length} envios</span>
          </div>
          {history.length === 0 ? (
            <div style={{ padding: 16, fontSize: 13, color: "var(--muted)" }}>
              Ainda não há histórico para {targetAccountName ?? "esta carteira"}. Ao aplicar um extrato, o resumo mensal e o arquivo original ficam guardados aqui.
            </div>
          ) : (() => {
            // Agrupar por ano
            const byYear = new Map<string, EvolutionEntry[]>();
            history.forEach((e) => {
              const year = e.dataRef.slice(0, 4) || "—";
              if (!byYear.has(year)) byYear.set(year, []);
              byYear.get(year)!.push(e);
            });
            const years = Array.from(byYear.keys()).sort((a, b) => b.localeCompare(a));
            return (
              <div style={{ overflowX: "auto" }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th>Arquivo</th>
                      <th className="r">Total</th>
                      <th className="r">Variação</th>
                      <th className="r">RF</th>
                      <th className="r">RV</th>
                      <th>Original</th>
                    </tr>
                  </thead>
                  <tbody>
                    {years.map((year) => {
                      const entries = byYear.get(year)!;
                      return entries.map((entry, idxInYear) => {
                        const globalIdx = history.indexOf(entry);
                        const previous = history[globalIdx + 1];
                        const delta = previous ? entry.total - previous.total : 0;
                        const isFirstInYear = idxInYear === 0;
                        return (
                          <>
                            {isFirstInYear && (
                              <tr key={`year-${year}`}>
                                <td
                                  colSpan={7}
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: ".08em",
                                    textTransform: "uppercase",
                                    color: "var(--accent)",
                                    background: "rgba(161,29,62,.06)",
                                    padding: "6px 10px",
                                    borderTop: "1px solid rgba(255,255,255,.06)",
                                  }}
                                >
                                  {year}
                                </td>
                              </tr>
                            )}
                            <tr key={entry.id}>
                              <td style={{ whiteSpace: "nowrap" }}>
                                {fmtDateBR(entry.dataRef)}
                              </td>
                              <td>
                                <strong>{entry.fileName}</strong>
                                <div style={{ color: "var(--muted)", fontSize: 11 }}>
                                  {entry.rfCount} RF · {entry.rvCount} RV
                                </div>
                              </td>
                              <td className="r">{fmtR(entry.total)}</td>
                              <td className="r" style={{ color: !previous ? "var(--muted)" : delta >= 0 ? "var(--good, #4E7A5C)" : "var(--accent)", fontWeight: previous ? 600 : 400 }}>
                                {previous ? fmtDelta(delta) : "—"}
                              </td>
                              <td className="r">{fmtR(entry.rf)}</td>
                              <td className="r">{fmtR(entry.rv)}</td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => downloadArchivedFile(entry.id).catch((err) => setArchiveError((err as Error).message))}
                                  style={{
                                    fontSize: 11,
                                    border: "1px solid rgba(255,255,255,.18)",
                                    background: "transparent",
                                    color: "var(--muted)",
                                    borderRadius: 6,
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                  }}
                                >
                                  baixar
                                </button>
                              </td>
                            </tr>
                          </>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {snapshotImportado && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-hdr">
            Modelo Vesta pronto <span>{fmtDateBR(snapshotImportado.data_referencia)}</span>
          </div>
          <div className="kpi-row" style={{ padding: 14 }}>
            <div className="kpi"><div className="kpi-l">Total</div><div className="kpi-v">{fmtR(snapshotImportado.total)}</div></div>
            <div className="kpi"><div className="kpi-l">Renda fixa</div><div className="kpi-v">{fmtR(snapshotImportado.rf)}</div></div>
            <div className="kpi"><div className="kpi-l">Renda variavel</div><div className="kpi-v">{fmtR(snapshotImportado.rv)}</div></div>
          </div>
          <div style={{ padding: "0 14px 14px", color: "var(--muted)", fontSize: 13 }}>
            {snapshotImportado.rf_ativos.length} ativos de RF e {snapshotImportado.rv_ativos?.length ?? 0} ativos de RV serao aplicados ao painel.
          </div>
          <div style={{ padding: "0 14px 14px" }}>
            <button onClick={aplicarAoPainel} className="btn-primary">
              Aplicar modelo Vesta
            </button>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="kpi-row">
            <div className="kpi">
              <div className="kpi-l">Arquivo</div>
              <div className="kpi-v" style={{ fontSize: 13 }}>{nomeArquivo}</div>
              <div className="kpi-s">{rows.length} linhas válidas</div>
            </div>
            <div className="kpi">
              <div className="kpi-l">Total importado</div>
              <div className="kpi-v blue">{fmtR(rfTotal + rvTotal)}</div>
              <div className="kpi-s">RF {fmtR(rfTotal)} · RV {fmtR(rvTotal)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-l">Renda fixa</div>
              <div className="kpi-v">{rfRows.length}</div>
              <div className="kpi-s">com taxa + vencimento</div>
            </div>
            <div className="kpi">
              <div className="kpi-l">RV / sem classif.</div>
              <div className="kpi-v warn">{rvRows.length}</div>
              <div className="kpi-s">fundos, ações, ETFs</div>
            </div>
          </div>

          {proventos.length > 0 && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="card-hdr">
                Pingados encontrados <span>{proventos.length} eventos provisionados</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Ativo</th>
                      <th>Evento</th>
                      <th>Pagamento</th>
                      <th className="r">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proventos.map((p, i) => (
                      <tr key={`${p.ticker}-${i}`}>
                        <td><strong>{p.ticker}</strong></td>
                        <td>{p.evento ?? "-"}</td>
                        <td>{p.dataPagamento ?? "-"}</td>
                        <td className="r">{fmtR(p.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-hdr">Aplicar ao painel</div>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                  Conta
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {accountOptions.map((id) => (
                    <button
                      key={id}
                      onClick={() => setAccount(id)}
                      style={{
                        padding: "7px 16px",
                        fontSize: 13,
                        borderRadius: 6,
                        border: account === id
                          ? "1px solid var(--accent)"
                          : "1px solid rgba(255,255,255,.15)",
                        background: account === id ? "rgba(161,29,62,.18)" : "transparent",
                        color: account === id ? "var(--accent)" : "var(--muted)",
                        cursor: "pointer",
                        fontWeight: account === id ? 600 : 400,
                      }}
                    >
                      {accountLabel(id)}
                    </button>
                  ))}
                </div>
                {!account && (
                  <div style={{ fontSize: 11, color: "var(--warning)", marginTop: 6 }}>
                    Conta não detectada no nome do arquivo — selecione acima.
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                  Data de referência do extrato
                </div>
                <input
                  type="date"
                  value={dataRef}
                  onChange={(e) => setDataRef(e.target.value)}
                  style={{
                    fontSize: 13,
                    padding: "7px 12px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,.2)",
                    background: "var(--card)",
                    color: "var(--fg, #f0ebe8)",
                  }}
                />
              </div>

              <button
                onClick={aplicarAoPainel}
                disabled={!account}
                style={{
                  padding: "11px 22px",
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 8,
                  border: "none",
                  background: account ? "var(--accent)" : "rgba(255,255,255,.08)",
                  color: account ? "#fff" : "var(--muted)",
                  cursor: account ? "pointer" : "not-allowed",
                  alignSelf: "flex-start",
                  letterSpacing: ".02em",
                }}
              >
                ✓ Aplicar ao painel
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-hdr">
              Prévia <span>{rows.length} ativos · RF = com taxa+vencimento</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Ativo</th>
                    <th className="r">Valor</th>
                    <th>Retorno</th>
                    <th>Detalhe XP</th>
                    <th>Classe</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const rf = isRF(r);
                    return (
                      <tr key={i}>
                        <td><strong>{r.ativo}</strong></td>
                        <td className="r">{fmtR(r.valor)}</td>
                        <td style={{ color: r.taxa?.trim().startsWith("-") ? "var(--accent)" : "var(--muted)" }}>
                          {r.taxa ?? r.rentabilidadeBruta ?? "-"}
                          {r.rentabilidadeBruta && r.rentabilidadeBruta !== r.taxa ? ` / bruta ${r.rentabilidadeBruta}` : ""}
                        </td>
                        <td style={{ color: "var(--muted)" }}>
                          {[r.venc ? `Venc. ${r.venc}` : null, r.precoMedio ? `PM ${r.precoMedio}` : null, r.ultimaCotacao ? `Cot. ${r.ultimaCotacao}` : null, r.quantidade ? `Qtd. ${r.quantidade}` : null].filter(Boolean).join(" - ") || "-"}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 8px",
                              borderRadius: 8,
                              background: rf
                                ? "rgba(74,124,89,.15)"
                                : "rgba(161,29,62,.12)",
                              color: rf ? "var(--good, #4E7A5C)" : "var(--accent)",
                              fontWeight: 600,
                            }}
                          >
                            {classLabel(r)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {rows.length === 0 && !erro && (
        <div className="card">
          <div className="card-hdr">Formato esperado</div>
          <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
            CSV/TXT com separador <strong>;</strong> ou <strong>,</strong> e cabeçalho contendo
            pelo menos:
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li><strong>Ativo</strong> (ou Papel / Título / Produto)</li>
              <li><strong>Valor</strong> (ou Posição / Saldo bruto)</li>
              <li><em>opcional:</em> Taxa / Indexador · Vencimento</li>
            </ul>
            <div style={{ marginTop: 10, fontSize: 12 }}>
              O arquivo será aplicado somente à carteira aberta: <strong>{targetAccountName ?? "carteira selecionada"}</strong>.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

