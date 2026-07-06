import { useState } from "react";
import { type LocalSnapshot, type RFAtivo, STORAGE_KEYS } from "@/data/vesta-users";

type ParsedRow = { ativo: string; valor: number; taxa?: string; venc?: string };
type AccountId = "paulo" | "cinthia";

const ACCOUNT_MAP: Record<string, AccountId> = {
  "5296823": "paulo",
  "6414212": "cinthia",
};

const ACCOUNT_LABEL: Record<AccountId, string> = {
  paulo: "Paulo (XP 5296823)",
  cinthia: "Cinthia (XP 6414212)",
};

function detectAccount(filename: string): AccountId | null {
  for (const [num, id] of Object.entries(ACCOUNT_MAP)) {
    if (filename.includes(num)) return id;
  }
  return null;
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
  return !!(row.venc && row.taxa);
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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtDateBR(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function UploadPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [account, setAccount] = useState<AccountId | null>(null);
  const [dataRef, setDataRef] = useState(todayISO());
  const [aplicado, setAplicado] = useState<{ account: AccountId; data: string } | null>(null);

  async function handleFile(file: File) {
    setErro(null);
    setAplicado(null);
    setNomeArquivo(file.name);
    try {
      if (!/\.(csv|txt)$/i.test(file.name))
        throw new Error("Formato não suportado. Use CSV/TXT exportado do portal XP.");
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length === 0) throw new Error("Nenhuma linha válida encontrada.");
      setRows(parsed);
      setAccount(detectAccount(file.name));
    } catch (e: unknown) {
      setRows([]);
      setErro(e instanceof Error ? e.message : "Erro ao ler o arquivo.");
    }
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
    };
    window.localStorage.setItem(STORAGE_KEYS[account], JSON.stringify(snap));
    setAplicado({ account, data: dataRef });
  }

  const fmtR = (n: number) => "R$ " + Math.round(n).toLocaleString("pt-BR");
  const rfRows = rows.filter(isRF);
  const rvRows = rows.filter((r) => !isRF(r));
  const rfTotal = rfRows.reduce((s, r) => s + r.valor, 0);
  const rvTotal = rvRows.reduce((s, r) => s + r.valor, 0);

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
            ✓ Posição de {ACCOUNT_LABEL[aplicado.account]} atualizada em {fmtDateBR(aplicado.data)}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            Abra qualquer página do painel — os números já refletem o arquivo importado.
          </div>
          <button
            onClick={() => {
              window.localStorage.removeItem(STORAGE_KEYS[aplicado.account]);
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
            Desfazer (volta aos dados hardcoded)
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
          accept=".csv,.txt"
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
                <div style={{ display: "flex", gap: 8 }}>
                  {(["paulo", "cinthia"] as AccountId[]).map((id) => (
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
                      {ACCOUNT_LABEL[id]}
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
              Prévia <span>{rows.length} ativos · RF classificada por taxa+vencimento</span>
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
              Exemplo: <code>Ativo;Valor;Taxa;Vencimento</code>
              <br />
              <code>NTN-B AGO/2026;96512,10;IPCA+9,45%;15/08/2026</code>
            </div>
            <div style={{ marginTop: 10, fontSize: 12 }}>
              Contas reconhecidas pelo nome do arquivo:{" "}
              <strong>5296823</strong> → Paulo · <strong>6414212</strong> → Cinthia.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
