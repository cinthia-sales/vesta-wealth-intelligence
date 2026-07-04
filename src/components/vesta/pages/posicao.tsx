import { useState } from "react";

type Status = "intocavel" | "urgente" | "monitorar";

type RFAsset = {
  n: string;
  v: number;
  t: number | null;
  cdi: number | null;
  venc: string;
  s: Status;
};

const RF: RFAsset[] = [
  { n: "NTN-B AGO/2026 (IPCA+9,45%)", v: 96511, t: 15.47, cdi: 120.7, venc: "15/08/2026", s: "urgente" },
  { n: "DEB J&F FEV/2028 (15,15%)", v: 94830, t: 15.15, cdi: 118.4, venc: "21/02/2028", s: "intocavel" },
  { n: "DEB JALLES DEZ/2031 (IPCA+8,5%)", v: 70642, t: 14.47, cdi: 113.0, venc: "15/12/2031", s: "intocavel" },
  { n: "XPAG11 XP Crédito Agro", v: 61373, t: null, cdi: null, venc: "—", s: "monitorar" },
  { n: "NTN-B 2050 (IPCA+4,45%)", v: 53341, t: 8.55, cdi: 66.8, venc: "15/08/2050", s: "monitorar" },
  { n: "LCA SICOOB MAR/2030 (92% CDI)", v: 37749, t: 13.57, cdi: 106.1, venc: "21/03/2030", s: "intocavel" },
  { n: "LCA SICOOB ABR/2030 (92% CDI)", v: 28389, t: 13.57, cdi: 106.1, venc: "04/04/2030", s: "intocavel" },
  { n: "LCA ORIGINAL DEZ/2028 (92,5%)", v: 26700, t: 13.61, cdi: 106.5, venc: "18/12/2028", s: "intocavel" },
  { n: "LCA SICOOB MAI/2030 (92% CDI)", v: 22491, t: 13.57, cdi: 106.1, venc: "10/05/2030", s: "intocavel" },
  { n: "NTN-B 2050 (IPCA+4,65%)", v: 23088, t: 8.74, cdi: 68.3, venc: "15/08/2050", s: "monitorar" },
  { n: "LCA SICOOB ABR/2030 B (92%)", v: 16842, t: 13.57, cdi: 106.1, venc: "15/04/2030", s: "intocavel" },
  { n: "LCA ORIGINAL MAR/2030 (94%)", v: 10418, t: 13.87, cdi: 108.4, venc: "06/03/2030", s: "intocavel" },
];

const SL: Record<Status, string> = { intocavel: "sb-a", urgente: "sb-r", monitorar: "sb-w" };
const ST: Record<Status, string> = { intocavel: "intocável", urgente: "urgente", monitorar: "monitorar" };

const RV = [
  { n: "PSSA3", v: "R$ 28.995", pm: "R$26,95 · 544 ações", r: "+97,75%", rc: "good", cls: "ação", sb: "sb-g" },
  { n: "ITSA4", v: "R$ 21.149", pm: "R$8,87 · 1.576 ações", r: "+51,28%", rc: "good", cls: "ação", sb: "sb-g" },
  { n: "BPAC11", v: "R$ 18.632", pm: "R$86,85 · 342 ações", r: "-37,27% ⚠️", rc: "bad", cls: "ação", sb: "sb-r" },
  { n: "TGRE11", v: "R$ 44.155", pm: "Aplicado R$50.000", r: "-11,69% capital", rc: "bad", cls: "FII", sb: "sb-w" },
  { n: "LFTB11", v: "R$ 20.301", pm: "165 cotas", r: "+CDI", rc: "good", cls: "ETF", sb: "sb-a" },
  { n: "GOLD11", v: "R$ 3.976", pm: "178 cotas", r: "+ouro", rc: "good", cls: "ETF", sb: "sb-a" },
  { n: "Outros ações", v: "R$ 9.392", pm: "ITUB4 + outros", r: "variado", rc: "muted", cls: "ação", sb: "sb-n" },
];

function fmtR(n: number) {
  return "R$ " + n.toLocaleString("pt-BR");
}

type Filter = "todos" | Status;

export function PosicaoPage() {
  const [f, setF] = useState<Filter>("todos");
  const list = f === "todos" ? RF : RF.filter((r) => r.s === f);
  const total = list.reduce((s, r) => s + r.v, 0);

  const fb = (id: Filter, label: string) => (
    <button className={"fbtn" + (f === id ? " on" : "")} onClick={() => setF(id)}>
      {label}
    </button>
  );

  return (
    <>
      <div className="ph">
        <h1>Posição atual</h1>
        <p>Todos os ativos com taxas, equivalência em CDI e status.</p>
      </div>

      <div
        style={{
          background: "var(--warning-bg)",
          border: "1px solid var(--warning)",
          borderRadius: "var(--radius)",
          padding: "12px 16px",
          marginBottom: 12,
          fontSize: 13,
        }}
      >
        <strong style={{ color: "var(--warning)" }}>⚠️ LCD BRDE FEV/2036 (92,5% CDI)</strong> — Este ativo
        está na conta da <strong>Cinthia</strong>, não na do Paulo. Taxa flutuante por 10 anos: quando a
        Selic cair, o rendimento cai junto. Não está incluído nos totais acima.
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Renda fixa <span>{list.length} ativos · {fmtR(total)}</span>
        </div>
        <div className="filter-row">
          {fb("todos", "Todos")}
          {fb("intocavel", "🔒 Intocáveis")}
          {fb("urgente", "🔴 Urgentes")}
          {fb("monitorar", "👁 Monitorar")}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Ativo</th>
                <th className="r">Valor</th>
                <th className="r">Taxa líq./ano</th>
                <th className="r">% CDI equiv.</th>
                <th>Vencimento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.n}>
                  <td><strong>{r.n}</strong></td>
                  <td className="r">{fmtR(r.v)}</td>
                  <td className="r">{r.t ? r.t.toFixed(2) + "%" : "—"}</td>
                  <td className="r">{r.cdi ? r.cdi.toFixed(1) + "% CDI" : "—"}</td>
                  <td>{r.venc}</td>
                  <td><span className={"sb " + SL[r.s]}>{ST[r.s]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          Renda variável <span>7 posições · R$116.399</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Ativo</th>
                <th className="r">Valor atual</th>
                <th className="r">PM / referência</th>
                <th className="r">Rentabilidade</th>
                <th>Classe</th>
              </tr>
            </thead>
            <tbody>
              {RV.map((r) => (
                <tr key={r.n}>
                  <td><strong>{r.n}</strong></td>
                  <td className="r">{r.v}</td>
                  <td className="r">{r.pm}</td>
                  <td
                    className={"r " + (r.rc === "muted" ? "" : r.rc)}
                    style={r.rc === "muted" ? { color: "var(--muted)" } : undefined}
                  >
                    {r.r}
                  </td>
                  <td><span className={"sb " + r.sb}>{r.cls}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
