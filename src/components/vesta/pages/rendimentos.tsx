import { PROVENTOS, type Provento } from "@/data/dividendos";
import type { ProfileId } from "@/lib/profile-derive";

function fmtR(n: number) {
  const s = Math.round(Math.abs(n)).toLocaleString("pt-BR");
  return (n < 0 ? "-R$ " : "R$ ") + s;
}

const FREQ_BADGE: Record<string, string> = {
  mensal: "sb-g",
  trimestral: "sb-a",
  semestral: "sb-w",
  anual: "sb-n",
};

// Alternativa segura — LCA 92% CDI isenta (mesmo benchmark usado no Validador)
const LCA_BENCH = 13.57;

// Ajustes específicos por ticker (come-cotas, apreciação histórica recente ao ano)
type Ajuste = { come_cotas?: number; aprec_hist?: number; nota_extra?: string };
const AJUSTES: Record<string, Ajuste> = {
  XPAG11: { come_cotas: 0.5, aprec_hist: 0, nota_extra: "Come-cotas mai/nov (Fiagro estruturado como FI)" },
  TGRE11: { come_cotas: 0, aprec_hist: -11.7, nota_extra: "Cota acumula -11,7% desde aplicação" },
  LFTB11: { come_cotas: 0, aprec_hist: 0, nota_extra: "ETF Tesouro Selic — cota estável por natureza" },
  BPAC11: { come_cotas: 0, aprec_hist: -37.3, nota_extra: "PM R$86,85 vs mercado R$54,48" },
  PSSA3: { come_cotas: 0, aprec_hist: 12, nota_extra: "+97,75% sobre PM histórico" },
  ITSA4: { come_cotas: 0, aprec_hist: 8, nota_extra: "+51,28% sobre PM histórico" },
};

// Cash-yield efetivo = DY - come-cotas - perda por não reinvestir automaticamente
// (proventos caem em conta corrente; perda aproximada = metade do DY parado meio ano ao CDI ~14%)
function raioX(p: Provento) {
  const aj = AJUSTES[p.ticker] ?? {};
  const dy = p.dy_pct;
  const come = aj.come_cotas ?? 0;
  // Perda por não reinvestir: gap vs benchmark LCA 92% CDI (13,57%) — se DY líq. já bate, perda = 0
  const dy_liq = dy - come;
  const perda_reinv = +Math.max(0, LCA_BENCH - dy_liq).toFixed(2);
  const cash_yield = +(dy_liq - perda_reinv).toFixed(2);
  const aprec = aj.aprec_hist ?? null;
  // Delta vs LCA considerando SÓ o cash yield (sem apreciação — a apreciação é o "extra" para vencer)
  const delta_taxa = +(cash_yield - LCA_BENCH).toFixed(2);
  const delta_rs = Math.round((delta_taxa / 100) * p.valor_posicao);
  const breakeven_aprec = +(-delta_taxa).toFixed(2); // apreciação necessária pra empatar
  // Veredito
  let verdict: "verde" | "amarelo" | "vermelho";
  if (delta_taxa >= 0) verdict = "verde";
  else if (breakeven_aprec <= 3 && (aprec === null || aprec > -3)) verdict = "amarelo";
  else verdict = "vermelho";
  return { dy, come, perda_reinv, cash_yield, aprec, delta_taxa, delta_rs, breakeven_aprec, verdict, nota_extra: aj.nota_extra };
}

const VERDICT_COLOR: Record<"verde" | "amarelo" | "vermelho", { bg: string; fg: string; label: string; icon: string }> = {
  verde: { bg: "rgba(74,124,89,.12)", fg: "#4E7A5C", label: "Cash yield já bate LCA", icon: "🟢" },
  amarelo: { bg: "rgba(216,179,106,.15)", fg: "#B8734A", label: "Empata só se cota subir", icon: "🟡" },
  vermelho: { bg: "var(--danger-bg)", fg: "var(--danger)", label: "Não compensa — dividendo não paga a queda", icon: "🔴" },
};


export function RendimentosPage({ profileId }: { profileId: ProfileId }) {
  // Cinthia = só RF isento, sem proventos de RV. Familiar/Paulo = usa PROVENTOS do Paulo.
  const list = profileId === "cinthia" || profileId.startsWith("member:")
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

          {/* ===== VALE O DIVIDENDO? — Raio-X por ativo ===== */}
          {(() => {
            const analise = list.map((p) => ({ p, r: raioX(p) }));
            const total_delta = analise.reduce((s, x) => s + x.r.delta_rs, 0);
            const total_cash = list.reduce((s, p) => s + p.valor_posicao * raioX(p).cash_yield / 100, 0);
            const total_lca = list.reduce((s, p) => s + p.valor_posicao * LCA_BENCH / 100, 0);
            return (
              <div className="card" style={{ marginTop: 14 }}>
                <div className="card-hdr">
                  Vale o dividendo? <span>raio-X do bruto ao líquido efetivo</span>
                </div>

                {/* Veredito consolidado */}
                <div style={{
                  margin: "0 16px 16px", padding: "14px 16px",
                  background: total_delta >= 0 ? "rgba(74,124,89,.10)" : "var(--danger-bg)",
                  borderLeft: `4px solid ${total_delta >= 0 ? "#4E7A5C" : "var(--danger)"}`,
                  borderRadius: 8, fontSize: 13,
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
                    {total_delta >= 0
                      ? "✅ No consolidado, os pagadores batem LCA só no cash yield."
                      : "⚠️ No consolidado, os pagadores PERDEM para LCA no cash yield."}
                  </div>
                  <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                    Cash yield efetivo dos {list.length} pagadores: <strong>{fmtR(total_cash)}/ano</strong> ·{" "}
                    Se estivesse tudo em LCA 92% CDI isenta: <strong>{fmtR(total_lca)}/ano</strong> ·{" "}
                    <strong style={{ color: total_delta >= 0 ? "#4E7A5C" : "var(--danger)" }}>
                      Delta: {fmtR(total_delta)}/ano
                    </strong>
                    <br />
                    <span style={{ fontSize: 12 }}>
                      Cash yield = DY nominal − come-cotas − perda por não reinvestir automaticamente.
                      A apreciação (ou queda) da cota é o "extra" que precisa acontecer pra vencer LCA.
                    </span>
                  </div>
                </div>

                {/* Cards individuais */}
                <div style={{ display: "grid", gap: 10, padding: "0 16px 16px" }}>
                  {analise.sort((a, b) => a.r.delta_rs - b.r.delta_rs).map(({ p, r }) => {
                    const v = VERDICT_COLOR[r.verdict];
                    return (
                      <div key={p.ticker} style={{
                        border: "1px solid var(--border, #E5DFD3)",
                        borderLeft: `4px solid ${v.fg}`,
                        borderRadius: 8, padding: 12, background: "var(--card)",
                      }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                          <strong style={{ fontFamily: "var(--font-elegant)", fontSize: 15 }}>
                            {v.icon} {p.ticker}
                          </strong>
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>
                            {p.classe} · {fmtR(p.valor_posicao)}
                          </span>
                          <span style={{
                            marginLeft: "auto", fontSize: 10, fontWeight: 600,
                            padding: "3px 10px", borderRadius: 12,
                            background: v.bg, color: v.fg,
                            textTransform: "uppercase", letterSpacing: ".06em",
                          }}>
                            {v.label}
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 12 }}>
                          {/* Coluna A — decomposição */}
                          <div>
                            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                              Do bruto ao efetivo
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 3, fontSize: 12 }}>
                              <span>DY nominal (anual)</span>
                              <span style={{ textAlign: "right" }}>{r.dy.toFixed(2)}%</span>
                              <span style={{ color: "var(--muted)" }}>(−) IR pessoa física</span>
                              <span style={{ textAlign: "right", color: "#4E7A5C" }}>0,00% (isento)</span>
                              <span style={{ color: "var(--muted)" }}>(−) Come-cotas est.</span>
                              <span style={{ textAlign: "right", color: r.come > 0 ? "var(--danger)" : "var(--muted)" }}>
                                {r.come > 0 ? `-${r.come.toFixed(2)}%` : "não se aplica"}
                              </span>
                              <span style={{ color: "var(--muted)" }}>(−) Sem reinvest. auto</span>
                              <span style={{ textAlign: "right", color: "var(--danger)" }}>-{r.perda_reinv.toFixed(2)}%</span>
                              <span style={{ borderTop: "1px solid var(--border,#E5DFD3)", paddingTop: 4, marginTop: 3, fontWeight: 700 }}>
                                = Cash yield efetivo
                              </span>
                              <span style={{ textAlign: "right", borderTop: "1px solid var(--border,#E5DFD3)", paddingTop: 4, marginTop: 3, fontWeight: 700 }}>
                                {r.cash_yield.toFixed(2)}%
                              </span>
                            </div>
                          </div>

                          {/* Coluna B — comparação */}
                          <div>
                            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                              vs LCA 92% CDI isenta ({LCA_BENCH}%)
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 3, fontSize: 12 }}>
                              <span>Delta de taxa</span>
                              <span style={{ textAlign: "right", color: r.delta_taxa >= 0 ? "#4E7A5C" : "var(--danger)", fontWeight: 700 }}>
                                {r.delta_taxa >= 0 ? "+" : ""}{r.delta_taxa.toFixed(2)}%
                              </span>
                              <span>Delta em R$/ano</span>
                              <span style={{ textAlign: "right", color: r.delta_rs >= 0 ? "#4E7A5C" : "var(--danger)", fontWeight: 700 }}>
                                {fmtR(r.delta_rs)}
                              </span>
                              <span style={{ color: "var(--muted)", marginTop: 4 }}>Cota precisa subir</span>
                              <span style={{ textAlign: "right", marginTop: 4, fontWeight: 600 }}>
                                {r.breakeven_aprec > 0 ? `+${r.breakeven_aprec.toFixed(2)}%/ano` : "já bate"}
                              </span>
                              {r.aprec !== null && (
                                <>
                                  <span style={{ color: "var(--muted)" }}>Apreciação histórica</span>
                                  <span style={{ textAlign: "right", color: r.aprec >= 0 ? "#4E7A5C" : "var(--danger)" }}>
                                    {r.aprec > 0 ? "+" : ""}{r.aprec.toFixed(1)}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {r.nota_extra && (
                          <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
                            ℹ️ {r.nota_extra}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}


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
