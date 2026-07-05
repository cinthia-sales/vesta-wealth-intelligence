import { useMemo, useState } from "react";
import type { ProfileId } from "@/lib/profile-derive";

function fmtR(n: number) {
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}

// Dados reais e consolidados: só o Paulo tem uma reestruturação registrada.
const PAULO_DATA = {
  custo: 14698,
  ganho: 692,
  ativos: [
    {
      fonte: "Debêntures novas vs antigas (J&F + Jalles vs Itapoá + Localiza)",
      capital: 112124,
      ganhoTaxa: "+3,05%/ano",
      ganhoMes: 285,
    },
    {
      fonte: "Fundos liquidados → novos ativos RF (LCAs + LCD BRDE)",
      capital: 267000,
      ganhoTaxa: "+1,83%/ano",
      ganhoMes: 407,
    },
  ],
  linhas: { tA: 0.1181, tB: 0.1486, cA: 125772, cB: 112124 },
  inicio: { ano: 2026, mes: 6 }, // jun/2026
};

/** ---------- Modo consolidado (Paulo) ---------- */
function BreakevenConsolidado({ data }: { data: typeof PAULO_DATA }) {
  const { custo, ganho, ativos, linhas, inicio } = data;
  const progs = [1, 3, 6, 9, 12, 18, 22].map((m) => {
    const a = ganho * m;
    const p = Math.min(100, Math.round((a / custo) * 100));
    const ok = p >= 100;
    const d = new Date(inicio.ano, inicio.mes + m, 1).toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
    });
    return { m, p, ok, d };
  });

  const points: { m: number; a: number; b: number }[] = [];
  for (let m = 0; m <= 78; m += 4) {
    points.push({
      m,
      a: linhas.cA * Math.pow(1 + linhas.tA, m / 12),
      b: linhas.cB * Math.pow(1 + linhas.tB, m / 12),
    });
  }
  const maxV = Math.max(...points.map((p) => Math.max(p.a, p.b)));
  const minV = Math.min(...points.map((p) => Math.min(p.a, p.b)));
  const W = 600, H = 220, PL = 50, PR = 12, PT = 10, PB = 22;
  const xs = (m: number) => PL + (m / 78) * (W - PL - PR);
  const ys = (v: number) => PT + (1 - (v - minV) / (maxV - minV)) * (H - PT - PB);
  const pathA = points.map((p, i) => (i ? "L" : "M") + xs(p.m) + " " + ys(p.a)).join(" ");
  const pathB = points.map((p, i) => (i ? "L" : "M") + xs(p.m) + " " + ys(p.b)).join(" ");

  const capitalTotal = ativos.reduce((s, a) => s + a.capital, 0);
  const mesesBreakeven = Math.ceil(custo / ganho);

  return (
    <>
      <div className="kpi-row">
        <div className="kpi"><div className="kpi-l">Custo total</div><div className="kpi-v bad">{fmtR(custo)}</div><div className="kpi-s">deságio + IR</div></div>
        <div className="kpi"><div className="kpi-l">Ganho mensal</div><div className="kpi-v good">+{fmtR(ganho)}</div><div className="kpi-s">soma das fontes abaixo</div></div>
        <div className="kpi"><div className="kpi-l">Breakeven combinado</div><div className="kpi-v blue">{mesesBreakeven} meses</div><div className="kpi-s">desde jul/26</div></div>
        <div className="kpi"><div className="kpi-l">Ganho anual vitalício</div><div className="kpi-v good">+{fmtR(ganho * 12)}</div><div className="kpi-s">depois do breakeven</div></div>
      </div>

      <div className="g32">
        <div className="card">
          <div className="card-hdr">Linha A (ficou) vs Linha B (reestruturou) <span>debêntures acumuladas</span></div>
          <div className="chart-c" style={{ height: 240 }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }}>
              <path d={pathA} fill="none" stroke="#dc2626" strokeWidth={2} />
              <path d={pathB} fill="none" stroke="#4f8ef7" strokeWidth={2} />
            </svg>
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 18, height: 2, background: "#dc2626" }} />
              Linha A — taxas antigas ({(linhas.tA * 100).toFixed(2)}%)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 18, height: 2, background: "#4f8ef7" }} />
              Linha B — reestruturado ({(linhas.tB * 100).toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="card">
          <div className="card-hdr">Recuperação mês a mês</div>
          {progs.map((p) => (
            <div className="prog" key={p.m}>
              <div className="prog-hdr">
                <span>{p.d} (m{p.m})</span>
                <span style={{ color: p.ok ? "var(--success)" : "var(--text)", fontWeight: p.ok ? 600 : 400 }}>
                  {p.p}%{p.ok ? " ✓" : ""}
                </span>
              </div>
              <div className="prog-bar">
                <div
                  className="prog-fill"
                  style={{ width: `${p.p}%`, background: p.ok ? "var(--success)" : "var(--accent)" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">De onde vem o ganho de +{fmtR(ganho)}/mês</div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Fonte</th>
              <th className="r">Capital</th>
              <th className="r">Ganho de taxa</th>
              <th className="r">Ganho/mês</th>
            </tr>
          </thead>
          <tbody>
            {ativos.map((a) => (
              <tr key={a.fonte}>
                <td>{a.fonte}</td>
                <td className="r">{fmtR(a.capital)}</td>
                <td className="r">{a.ganhoTaxa}</td>
                <td className="r good"><strong>+{fmtR(a.ganhoMes)}/mês</strong></td>
              </tr>
            ))}
            <tr style={{ background: "#f8f9ff" }}>
              <td><strong>Total combinado</strong></td>
              <td className="r"><strong>{fmtR(capitalTotal)}</strong></td>
              <td className="r">—</td>
              <td className="r good" style={{ fontSize: 15 }}><strong>+{fmtR(ganho)}/mês</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

/** ---------- Modo simulação (Cínthia / Familiar / quem ainda não girou nada) ---------- */
type LinhaGiro = {
  id: string;
  desc: string;
  capital: number;
  taxaAntiga: number; // %/ano
  taxaNova: number; // %/ano
};

function novaLinha(): LinhaGiro {
  return {
    id: Math.random().toString(36).slice(2, 9),
    desc: "",
    capital: 0,
    taxaAntiga: 0,
    taxaNova: 0,
  };
}

function BreakevenSimulador({ profileId }: { profileId: ProfileId }) {
  const [custo, setCusto] = useState(0);
  const [linhas, setLinhas] = useState<LinhaGiro[]>([novaLinha()]);

  const ganhoMesPorLinha = linhas.map(
    (l) => (l.capital * (l.taxaNova - l.taxaAntiga)) / 100 / 12,
  );
  const ganhoMes = ganhoMesPorLinha.reduce((s, v) => s + v, 0);
  const capitalTotal = linhas.reduce((s, l) => s + l.capital, 0);

  const mesesBreakeven = ganhoMes > 0 ? Math.ceil(custo / ganhoMes) : Infinity;
  const ganhoAno = ganhoMes * 12;

  const progs = useMemo(() => {
    if (ganhoMes <= 0 || custo <= 0) return [];
    const marcos = [1, 3, 6, 12, mesesBreakeven, Math.round(mesesBreakeven * 1.2)]
      .filter((v, i, arr) => v > 0 && isFinite(v) && arr.indexOf(v) === i)
      .sort((a, b) => a - b);
    return marcos.map((m) => {
      const a = ganhoMes * m;
      const p = Math.min(100, Math.round((a / custo) * 100));
      const ok = p >= 100;
      const d = new Date(2026, 6 + m, 1).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
      return { m, p, ok, d };
    });
  }, [custo, ganhoMes, mesesBreakeven]);

  // Linha A = manter tudo com taxa antiga (média ponderada pelo capital)
  // Linha B = giro pra taxa nova
  const capitalTotalSafe = capitalTotal > 0 ? capitalTotal : 1;
  const tAmedia =
    linhas.reduce((s, l) => s + (l.capital * l.taxaAntiga) / 100, 0) / capitalTotalSafe;
  const tBmedia =
    linhas.reduce((s, l) => s + (l.capital * l.taxaNova) / 100, 0) / capitalTotalSafe;

  const points: { m: number; a: number; b: number }[] = [];
  const horizonte = Math.max(24, Math.min(120, (isFinite(mesesBreakeven) ? mesesBreakeven : 60) * 3));
  for (let m = 0; m <= horizonte; m += Math.max(1, Math.round(horizonte / 20))) {
    points.push({
      m,
      a: capitalTotal * Math.pow(1 + tAmedia, m / 12),
      b: capitalTotal * Math.pow(1 + tBmedia, m / 12),
    });
  }
  const maxV = Math.max(1, ...points.map((p) => Math.max(p.a, p.b)));
  const minV = Math.min(...points.map((p) => Math.min(p.a, p.b)));
  const W = 600, H = 220, PL = 50, PR = 12, PT = 10, PB = 22;
  const xs = (m: number) => PL + (m / horizonte) * (W - PL - PR);
  const ys = (v: number) =>
    maxV === minV ? PT : PT + (1 - (v - minV) / (maxV - minV)) * (H - PT - PB);
  const pathA = points.map((p, i) => (i ? "L" : "M") + xs(p.m) + " " + ys(p.a)).join(" ");
  const pathB = points.map((p, i) => (i ? "L" : "M") + xs(p.m) + " " + ys(p.b)).join(" ");

  const setLinha = (id: string, patch: Partial<LinhaGiro>) =>
    setLinhas((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const removerLinha = (id: string) =>
    setLinhas((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.id !== id)));

  return (
    <>
      <div className="card" style={{ marginBottom: 14, borderLeft: "4px solid var(--accent)" }}>
        <div className="card-hdr">
          Simulador de giro & breakeven <span>modo hipotético</span>
        </div>
        <div style={{ padding: 16, fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
          A carteira {profileId === "familiar" ? "consolidada" : "de " + profileId} ainda não
          registrou uma reestruturação de ativos. Adicione uma linha por lugar que você está{" "}
          <strong>tirando dinheiro</strong> e realocando — pode ser um só, ou vários. Se ainda
          não souber a taxa antiga ou a nova, deixe em zero e volte quando descobrir.
        </div>

        <div style={{ padding: "0 16px 16px", display: "grid", gap: 12 }}>
          <label className="bk-field">
            Custo total do giro (R$)
            <input
              type="number"
              min={0}
              value={custo || ""}
              placeholder="ex.: deságio + IR na saída"
              onChange={(e) => setCusto(Number(e.target.value) || 0)}
            />
          </label>

          {linhas.map((l, idx) => {
            const ganho = ganhoMesPorLinha[idx];
            return (
              <div
                key={l.id}
                style={{
                  border: "1px solid var(--border, #E5DFD3)",
                  borderRadius: 8,
                  padding: 12,
                  background: "var(--card, #fff)",
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontFamily: "var(--font-display)", fontSize: 13 }}>
                    Linha {idx + 1}
                  </strong>
                  {linhas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerLinha(l.id)}
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      remover
                    </button>
                  )}
                </div>
                <label className="bk-field">
                  Descrição (opcional)
                  <input
                    type="text"
                    value={l.desc}
                    placeholder="ex.: fundo XYZ → LCA nova"
                    onChange={(e) => setLinha(l.id, { desc: e.target.value })}
                  />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <label className="bk-field">
                    Capital (R$)
                    <input
                      type="number"
                      min={0}
                      value={l.capital || ""}
                      onChange={(e) => setLinha(l.id, { capital: Number(e.target.value) || 0 })}
                    />
                  </label>
                  <label className="bk-field">
                    Taxa antiga (%/ano)
                    <input
                      type="number"
                      step={0.01}
                      value={l.taxaAntiga || ""}
                      onChange={(e) => setLinha(l.id, { taxaAntiga: Number(e.target.value) || 0 })}
                    />
                  </label>
                  <label className="bk-field">
                    Taxa nova (%/ano)
                    <input
                      type="number"
                      step={0.01}
                      value={l.taxaNova || ""}
                      onChange={(e) => setLinha(l.id, { taxaNova: Number(e.target.value) || 0 })}
                    />
                  </label>
                </div>
                <div style={{ fontSize: 12, color: ganho > 0 ? "var(--success)" : "var(--muted)" }}>
                  Ganho mensal desta linha:{" "}
                  <strong>
                    {ganho > 0 ? "+" : ""}
                    {fmtR(ganho)}
                  </strong>
                  {l.capital === 0 || l.taxaAntiga === 0 || l.taxaNova === 0
                    ? " · preencha capital e as duas taxas"
                    : ""}
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setLinhas((prev) => [...prev, novaLinha()])}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 12,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px dashed var(--accent)",
              background: "transparent",
              color: "var(--accent)",
              cursor: "pointer",
              justifySelf: "start",
            }}
          >
            + adicionar linha de giro
          </button>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-l">Custo simulado</div>
          <div className="kpi-v bad">{fmtR(custo)}</div>
          <div className="kpi-s">hipótese</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Ganho mensal total</div>
          <div className="kpi-v good">+{fmtR(ganhoMes)}</div>
          <div className="kpi-s">soma das {linhas.length} linha{linhas.length > 1 ? "s" : ""}</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Breakeven</div>
          <div className="kpi-v blue">
            {isFinite(mesesBreakeven) && mesesBreakeven > 0 ? `${mesesBreakeven} meses` : "—"}
          </div>
          <div className="kpi-s">
            {isFinite(mesesBreakeven) && mesesBreakeven > 0
              ? "até o giro se pagar"
              : "preencha custo e ganho"}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Ganho anual pós-breakeven</div>
          <div className="kpi-v good">+{fmtR(ganhoAno)}</div>
          <div className="kpi-s">recorrente</div>
        </div>
      </div>

      <div className="g32">
        <div className="card">
          <div className="card-hdr">
            Linha A vs Linha B <span>capital total {fmtR(capitalTotal)}</span>
          </div>
          <div className="chart-c" style={{ height: 240 }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }}>
              <path d={pathA} fill="none" stroke="#dc2626" strokeWidth={2} />
              <path d={pathB} fill="none" stroke="#4f8ef7" strokeWidth={2} />
            </svg>
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 10, fontSize: 12, color: "var(--muted)", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 18, height: 2, background: "#dc2626" }} />
              Linha A — taxa antiga média ({(tAmedia * 100).toFixed(2)}%)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 18, height: 2, background: "#4f8ef7" }} />
              Linha B — taxa nova média ({(tBmedia * 100).toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="card">
          <div className="card-hdr">Recuperação mês a mês</div>
          {progs.length === 0 && (
            <div style={{ padding: 16, color: "var(--muted)", fontSize: 13 }}>
              Preencha o custo do giro e pelo menos uma linha com ganho positivo pra ver a recuperação.
            </div>
          )}
          {progs.map((p) => (
            <div className="prog" key={p.m}>
              <div className="prog-hdr">
                <span>{p.d} (m{p.m})</span>
                <span
                  style={{
                    color: p.ok ? "var(--success)" : "var(--text)",
                    fontWeight: p.ok ? 600 : 400,
                  }}
                >
                  {p.p}%{p.ok ? " ✓" : ""}
                </span>
              </div>
              <div className="prog-bar">
                <div
                  className="prog-fill"
                  style={{
                    width: `${p.p}%`,
                    background: p.ok ? "var(--success)" : "var(--accent)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: 14,
          fontSize: 12,
          color: "var(--muted)",
          background: "rgba(216,179,106,.08)",
          border: "1px solid rgba(216,179,106,.28)",
        }}
      >
        💡 Se ainda não sabe a taxa antiga ou a nova de alguma linha, deixe em zero — o ganho
        daquela linha fica em espera. Só as linhas com as três casas preenchidas (capital, taxa
        antiga, taxa nova) entram no cálculo do breakeven.
      </div>
    </>
  );
}


export function BreakevenPage({ profileId }: { profileId: ProfileId }) {
  const temGiroReal = profileId === "paulo";
  const [simular, setSimular] = useState(false);

  if (temGiroReal) {
    return (
      <>
        <div className="ph">
          <h1>Plano de breakeven</h1>
          <p>Quando a reestruturação de junho/2026 se paga completamente.</p>
        </div>
        <BreakevenConsolidado data={PAULO_DATA} />
      </>
    );
  }

  return (
    <>
      <div className="ph">
        <h1>Plano de breakeven</h1>
        <p>
          Nenhum movimento foi marcado ainda como <em>giro de breakeven</em> nesta carteira.
        </p>
      </div>

      <div
        className="card"
        style={{
          padding: "28px 22px",
          textAlign: "center",
          marginBottom: 14,
          borderLeft: "4px solid var(--accent)",
        }}
      >
        <div style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 8 }}>
          Acelerador em repouso
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: 460, margin: "0 auto 16px" }}>
          O acelerador só aparece quando você marca operações da carteira como
          <strong> movimentos de breakeven</strong>. Enquanto nenhuma for marcada, esta tela
          fica em branco — nada da carteira do Paulo aparece aqui.
        </p>
        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, maxWidth: 460, margin: "0 auto 18px" }}>
          Quer testar a mecânica sem marcar nada? Abra o simulador — os números são hipotéticos,
          não afetam a carteira real.
        </p>
        <button
          type="button"
          onClick={() => setSimular((v) => !v)}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 12,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            padding: "8px 18px",
            borderRadius: 999,
            border: "1px solid var(--accent)",
            background: simular ? "var(--accent)" : "transparent",
            color: simular ? "#fff" : "var(--accent)",
            cursor: "pointer",
          }}
        >
          {simular ? "Fechar simulador" : "Abrir simulador hipotético"}
        </button>
      </div>

      {simular && <BreakevenSimulador profileId={profileId} />}
    </>
  );
}

// prevent unused warning
export const __fmtR = fmtR;
