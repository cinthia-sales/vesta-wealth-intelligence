import { useState } from "react";

type ParsedRow = { ativo: string; valor: number; taxa?: string; venc?: string };

export function UploadPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

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
      throw new Error("Cabeçalhos não encontrados. Precisa ter coluna de 'Ativo' e 'Valor'.");
    return lines.slice(1).map((line) => {
      const c = line.split(sep);
      const raw = (c[iValor] ?? "").replace(/[R$\s.]/g, "").replace(",", ".");
      return {
        ativo: (c[iAtivo] ?? "").trim(),
        valor: Number(raw) || 0,
        taxa: iTaxa >= 0 ? c[iTaxa]?.trim() : undefined,
        venc: iVenc >= 0 ? c[iVenc]?.trim() : undefined,
      };
    }).filter((r) => r.ativo && r.valor > 0);
  }

  async function handleFile(file: File) {
    setErro(null);
    setNomeArquivo(file.name);
    try {
      if (!/\.(csv|txt)$/i.test(file.name))
        throw new Error("Formato não suportado. Use CSV/TXT exportado do portal XP.");
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length === 0) throw new Error("Nenhuma linha válida encontrada.");
      setRows(parsed);
    } catch (e: unknown) {
      setRows([]);
      setErro(e instanceof Error ? e.message : "Erro ao ler o arquivo.");
    }
  }

  const total = rows.reduce((s, r) => s + r.valor, 0);
  const fmtR = (n: number) => "R$ " + Math.round(n).toLocaleString("pt-BR");

  return (
    <>
      <div className="ph">
        <h1>Importar arquivos XP</h1>
        <p>
          Suba o extrato CSV/TXT exportado do portal XP para conferir posições e detectar
          divergências em relação aos dados atuais do painel.
        </p>
      </div>

      <div
        className={"drop-zone" + (drag ? " over" : "")}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault(); setDrag(false);
          const f = e.dataTransfer.files[0]; if (f) handleFile(f);
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
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
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
              <div className="kpi-v" style={{ fontSize: 14 }}>{nomeArquivo}</div>
              <div className="kpi-s">{rows.length} linhas válidas</div>
            </div>
            <div className="kpi">
              <div className="kpi-l">Total lido</div>
              <div className="kpi-v blue">{fmtR(total)}</div>
              <div className="kpi-s">soma da coluna Valor</div>
            </div>
            <div className="kpi">
              <div className="kpi-l">Com vencimento</div>
              <div className="kpi-v">{rows.filter((r) => r.venc).length}</div>
              <div className="kpi-s">RF identificada</div>
            </div>
            <div className="kpi">
              <div className="kpi-l">Sem taxa detectada</div>
              <div className="kpi-v warn">{rows.filter((r) => !r.taxa).length}</div>
              <div className="kpi-s">pode ser RV ou fundo</div>
            </div>
          </div>

          <div className="card">
            <div className="card-hdr">Prévia dos dados <span>ainda não integra ao painel</span></div>
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead><tr><th>Ativo</th><th className="r">Valor</th><th>Taxa</th><th>Vencimento</th></tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td><strong>{r.ativo}</strong></td>
                      <td className="r">{fmtR(r.valor)}</td>
                      <td style={{ color: "var(--muted)" }}>{r.taxa ?? "—"}</td>
                      <td style={{ color: "var(--muted)" }}>{r.venc ?? "—"}</td>
                    </tr>
                  ))}
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
            CSV/TXT com separador <strong>;</strong> ou <strong>,</strong> e cabeçalho contendo pelo menos:
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li><strong>Ativo</strong> (ou Papel / Título / Produto)</li>
              <li><strong>Valor</strong> (ou Posição / Saldo bruto)</li>
              <li><em>opcional:</em> Taxa / Indexador · Vencimento</li>
            </ul>
            <div style={{ marginTop: 10, fontSize: 12 }}>
              Exemplo: <code>Ativo;Valor;Taxa;Vencimento</code><br />
              <code>NTN-B AGO/2026;96512,10;IPCA+9,45%;15/08/2026</code>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
