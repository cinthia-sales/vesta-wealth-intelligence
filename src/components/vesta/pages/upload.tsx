import { useState, useEffect } from "react";
import { type LocalSnapshot, type RFAtivo, STORAGE_KEYS } from "@/data/vesta-users";

type ParsedRow = { ativo: string; valor: number; taxa?: string; venc?: string; classe?: "RF" | "RV" };
type ParsedFile = { rows: ParsedRow[]; dataRef?: string };
type AccountId = string;

function storageKey(accountId: AccountId): string {
  if (accountId === "paulo" || accountId === "cinthia") return STORAGE_KEYS[accountId];
  return "vesta_posicao_" + accountId;
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

function toRFAtivo(row: ParsedRow): RFAtivo {
  return {
    n: row.ativo,
    v: row.valor,
    t: null,
    cdi: null,
    venc: row.venc ?? "—",
    s: "monitorar",
    nota: row.taxa ? `Taxa XP: ${row.taxa}` : undefined,
  };
}

function toRVAtivo(row: ParsedRow) {
  return {
    n: row.ativo,
    v: "R$ " + Math.round(row.valor).toLocaleString("pt-BR"),
    pm: "Importado XP",
    r: row.taxa ?? "—",
    rc: "neutral",
    cls: "RV/Fundo",
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

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Este navegador não consegue descompactar XLSX. Exporte em CSV/TXT ou use Chrome/Edge atualizado.");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
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
    if (row.some((cell) => normalizeLabel(cell) === "posicao")) {
      header = row.map((cell) => cell.toLowerCase());
      continue;
    }
    if (!header || !first || first === " ") continue;

    const normalizedHeader = header.map(normalizeLabel);
    const valorIndex = normalizedHeader.findIndex((cell) => /posicao|valor liquido|saldo bruto/.test(cell));
    const vencIndex = header.findIndex((cell) => /vencimento/.test(cell));
    const taxaIndex = header.findIndex((cell) => /taxa|rentabilidade|indexador/.test(cell));
    const valor = moneyToNumber(row[valorIndex] ?? "");
    if (!valor) continue;

    const sectionKey = normalizeLabel(section);
    const classe: "RF" | "RV" = /tesouro|renda fixa|fundos de investimentos|pos-fixado|prefixado|inflacao/.test(sectionKey)
      ? "RF"
      : "RV";
    parsed.push({
      ativo: first,
      valor,
      venc: vencIndex >= 0 ? row[vencIndex] || undefined : undefined,
      taxa: taxaIndex >= 0 ? row[taxaIndex] || undefined : undefined,
      classe,
    });
  }

  return { rows: parsed, dataRef };
}

export function UploadPage({
  targetAccountId,
  targetAccountName,
}: {
  targetAccountId?: AccountId;
  targetAccountName?: string;
} = {}) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [account, setAccount] = useState<AccountId | null>(null);
  const [dataRef, setDataRef] = useState(todayISO());
  const [aplicado, setAplicado] = useState<{ label: string; data: string; key: string } | null>(null);

  useEffect(() => {
    setAccount(targetAccountId ?? null);
  }, [targetAccountId]);

  async function handleFile(file: File) {
    setErro(null);
    setAplicado(null);
    setNomeArquivo(file.name);
    try {
      if (!/\.(xlsx|csv|txt)$/i.test(file.name))
        throw new Error("Formato não suportado. Use CSV/TXT exportado do portal XP.");
      const parsed = /\.(xlsx)$/i.test(file.name)
        ? await parseXlsx(file)
        : { rows: parseCsv(await file.text()) };
      if (parsed.rows.length === 0) throw new Error("Nenhuma linha válida encontrada.");
      setRows(parsed.rows);
      if (parsed.dataRef) setDataRef(parsed.dataRef);
    } catch (e: unknown) {
      setRows([]);
      setErro(e instanceof Error ? e.message : "Erro ao ler o arquivo.");
    }
  }

  function accountLabel(id: AccountId): string {
    if (id === targetAccountId && targetAccountName) return targetAccountName;
    return "Carteira selecionada";
  }

  function aplicarAoPainel() {
    if (!account) return;
    const rfRows = rows.filter(isRF);
    const rvRows = rows.filter((r) => !isRF(r));
    const rf = rfRows.reduce((s, r) => s + r.valor, 0);
    const rv = rvRows.reduce((s, r) => s + r.valor, 0);
    const snap: LocalSnapshot = {
      profileId: account,
      data_referencia: dataRef,
      saved_at: new Date().toISOString(),
      total: rf + rv,
      rf,
      rv,
      rf_ativos: rfRows.map(toRFAtivo),
      rv_ativos: rvRows.map(toRVAtivo),
    };
    const key = storageKey(account);
    window.localStorage.setItem(key, JSON.stringify(snap));
    setAplicado({ label: accountLabel(account), data: dataRef, key });
  }

  const fmtR = (n: number) => "R$ " + Math.round(n).toLocaleString("pt-BR");
  const rfRows = rows.filter(isRF);
  const rvRows = rows.filter((r) => !isRF(r));
  const rfTotal = rfRows.reduce((s, r) => s + r.valor, 0);
  const rvTotal = rvRows.reduce((s, r) => s + r.valor, 0);

  // Opções de conta disponíveis para seleção
  const accountOptions: AccountId[] = targetAccountId ? [targetAccountId] : [];

  return (
    <>
      <div className="ph">
        <h1>Importar posição XP</h1>
        <p>
          Suba o CSV/TXT exportado do portal XP. Após aplicar, todos os simuladores passam a
          usar os dados do arquivo automaticamente.
        </p>
      </div>

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
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        style={{ marginBottom: 14 }}
      >
        <div style={{ fontSize: 15, marginBottom: 6 }}>📥 Arraste o CSV/TXT aqui</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
          ou selecione manualmente
        </div>
        <input
          type="file"
          accept=".xlsx,.csv,.txt"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
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
                    <th>Taxa</th>
                    <th>Vencimento</th>
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
                        <td style={{ color: "var(--muted)" }}>{r.taxa ?? "—"}</td>
                        <td style={{ color: "var(--muted)" }}>{r.venc ?? "—"}</td>
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
                            {rf ? "RF" : "RV/Fundo"}
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
