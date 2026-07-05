import { PROVENTOS } from "@/data/dividendos";
import type { ProfileId } from "@/lib/profile-derive";

function fmtR(n: number) {
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}

const FREQ_BADGE: Record<string, string> = {
  mensal: "sb-g",
  trimestral: "sb-a",
  semestral: "sb-w",
  anual: "sb-n",
};

export function RendimentosPage({ profileId }: { profileId: ProfileId }) {
  // Cinthia = só RF isento, sem proventos de RV. Familiar/Paulo = usa PROVENTOS do Paulo.
  const list = profileId === "cinthia"
    ? []
    : PROVENTOS.filter((p) => p.provento_ano > 0);

  const total_ano = list.reduce((s, p) => s + p.provento_ano, 0);
  const total_mes = total_ano / 12;
  const total_pos = list.reduce((s, p) => s + p.valor_posicao, 0);
  const dy_medio = total_pos > 0 ? (total_ano / total_pos) * 100 : 0;

  const porClasse = ["FI-Agro", "FII", "ETF", "Ação"].map((cls) => {
    const items = list.filter((p) => p.classe === cls);
    const ano = items.reduce((s, p) => s + p.provento_ano, 0);
    return { cls, count: items.length, ano };
  }).filter((c) => c.count > 0);

  return (
    <>
      <div className="ph">
        <h1>💰 Rendimentos recorrentes</h1>
        <p>
          O <strong>pingado</strong> que ninguém rastreia: dividendos, JCP e rendimentos
          isentos de FIIs/FI-Agro que caem todo mês. Estimativas com base nos últimos 12 meses.
        </p>
      </div>

      {profileId === "cinthia" && (
        <div className="card">
          <div className="card-hdr">Carteira 100% renda fixa</div>
          <p style={{ padding: 16, color: "var(--muted)", fontSize: 13 }}>
            Sua carteira, Cinthia, é totalmente pós-fixada isenta (LCI/LCA/LCD). Os rendimentos
            são incorporados ao principal e só saem no vencimento — não há proventos mensais aqui.
            O fluxo recorrente da família vem da carteira RV do Paulo.
          </p>
        </div>
      )}

      {list.length > 0 && (
        <>
          {/* KPIs */}
          <div className="kpis" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Fluxo anual estimado</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)", marginTop: 4 }}>{fmtR(total_ano)}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{list.length} pagadores</div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Média por mês</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{fmtR(total_mes)}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>pingado recorrente</div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>DY médio ponderado</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{dy_medio.toFixed(2)}%</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>sobre {fmtR(total_pos)}</div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Isentos de IR (PF)</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--good, #4E7A5C)", marginTop: 4 }}>
                {fmtR(list.filter((p) => p.classe === "FII" || p.classe === "FI-Agro").reduce((s, p) => s + p.provento_ano, 0))}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>FIIs + FI-Agro / ano</div>
            </div>
          </div>

          {/* Resumo por classe */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-hdr">Por classe de ativo</div>
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Classe</th>
                    <th className="r">Pagadores</th>
                    <th className="r">Fluxo/ano</th>
                    <th className="r">Fluxo/mês</th>
                    <th className="r">% do total</th>
                  </tr>
                </thead>
                <tbody>
                  {porClasse.map((c) => (
                    <tr key={c.cls}>
                      <td><strong>{c.cls}</strong></td>
                      <td className="r">{c.count}</td>
                      <td className="r">{fmtR(c.ano)}</td>
                      <td className="r">{fmtR(c.ano / 12)}</td>
                      <td className="r">{((c.ano / total_ano) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detalhe por ativo */}
          <div className="card">
            <div className="card-hdr">
              Ativos pagadores <span>{list.length} · {fmtR(total_ano)}/ano</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Ativo</th>
                    <th>Classe</th>
                    <th className="r">Posição</th>
                    <th className="r">DY est.</th>
                    <th className="r">R$/ano</th>
                    <th className="r">R$/mês</th>
                    <th>Frequência</th>
                  </tr>
                </thead>
                <tbody>
                  {list
                    .slice()
                    .sort((a, b) => b.provento_ano - a.provento_ano)
                    .map((p) => (
                      <tr key={p.ticker}>
                        <td>
                          <strong>💰 {p.ticker}</strong>
                          {p.nota && (
                            <>
                              <br />
                              <span style={{ fontSize: 11, color: "var(--muted)" }}>{p.nota}</span>
                            </>
                          )}
                        </td>
                        <td>{p.classe}</td>
                        <td className="r">{fmtR(p.valor_posicao)}</td>
                        <td className="r">{p.dy_pct.toFixed(1)}%</td>
                        <td className="r"><strong>{fmtR(p.provento_ano)}</strong></td>
                        <td className="r">{fmtR(p.provento_mes)}</td>
                        <td><span className={"sb " + FREQ_BADGE[p.freq]}>{p.freq}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              padding: "12px 16px",
              background: "rgba(74,124,89,.08)",
              border: "1px solid rgba(74,124,89,.25)",
              borderRadius: "var(--radius)",
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            💡 <strong>Nota:</strong> valores estimados com base no histórico dos últimos 12 meses.
            FIIs e FI-Agro são isentos de IR para pessoa física. Dividendos de ações também são
            isentos; JCP tem retenção de 15% na fonte (já refletida nos valores).
          </div>
        </>
      )}
    </>
  );
}
