function fmtR(n: number) {
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}

const CUSTO = 14698;
const GANHO = 692;

export function BreakevenPage() {
  const progs = [1, 3, 6, 9, 12, 18, 22].map((m) => {
    const a = GANHO * m;
    const p = Math.min(100, Math.round((a / CUSTO) * 100));
    const ok = p >= 100;
    const d = new Date(2026, 6 + m, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    return { m, p, ok, d };
  });

  // Chart data (linhas A e B ao longo de 78 meses)
  const tA = 0.1181, tB = 0.1486, cA = 125772, cB = 112124;
  const points: { m: number; a: number; b: number }[] = [];
  for (let m = 0; m <= 78; m += 4) {
    points.push({
      m,
      a: cA * Math.pow(1 + tA, m / 12),
      b: cB * Math.pow(1 + tB, m / 12),
    });
  }
  const maxV = Math.max(...points.map((p) => Math.max(p.a, p.b)));
  const minV = Math.min(...points.map((p) => Math.min(p.a, p.b)));
  const W = 600, H = 220, PL = 50, PR = 12, PT = 10, PB = 22;
  const xs = (m: number) => PL + (m / 78) * (W - PL - PR);
  const ys = (v: number) => PT + (1 - (v - minV) / (maxV - minV)) * (H - PT - PB);
  const pathA = points.map((p, i) => (i ? "L" : "M") + xs(p.m) + " " + ys(p.a)).join(" ");
  const pathB = points.map((p, i) => (i ? "L" : "M") + xs(p.m) + " " + ys(p.b)).join(" ");

  return (
    <>
      <div className="ph">
        <h1>Plano de breakeven</h1>
        <p>Quando a reestruturação de junho/2026 se paga completamente.</p>
      </div>

      <div className="kpi-row">
        <div className="kpi"><div className="kpi-l">Custo total</div><div className="kpi-v bad">R$ 14.698</div><div className="kpi-s">deságio R$13.648 + IR R$1.049</div></div>
        <div className="kpi"><div className="kpi-l">Ganho mensal</div><div className="kpi-v good">+R$ 692</div><div className="kpi-s">+R$285 debs + R$407 fundos→RF</div></div>
        <div className="kpi"><div className="kpi-l">Breakeven combinado</div><div className="kpi-v blue">mai/2028</div><div className="kpi-s">22 meses · mês 22 desde jul/26</div></div>
        <div className="kpi"><div className="kpi-l">Ganho anual vitalício</div><div className="kpi-v good">+R$ 8.309</div><div className="kpi-s">depois do breakeven todo ano</div></div>
      </div>

      <div className="g32">
        <div className="card">
          <div className="card-hdr">Linha A (ficou) vs Linha B (reestruturou) <span>valores acumulados nas debêntures</span></div>
          <div className="chart-c" style={{ height: 240 }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }}>
              <path d={pathA} fill="none" stroke="#dc2626" strokeWidth={2} />
              <path d={pathB} fill="none" stroke="#4f8ef7" strokeWidth={2} />
            </svg>
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 18, height: 2, background: "#dc2626" }} />
              Linha A — taxas antigas (média 11,81%)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 18, height: 2, background: "#4f8ef7" }} />
              Linha B — reestruturado (média 14,86%)
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
        <div className="card-hdr">De onde vem o ganho de +R$692/mês</div>
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
            <tr>
              <td>Debêntures novas vs antigas (J&F + Jalles vs Itapoá + Localiza)</td>
              <td className="r">R$112.124</td>
              <td className="r">+3,05%/ano</td>
              <td className="r good"><strong>+R$ 285/mês</strong></td>
            </tr>
            <tr>
              <td>Fundos liquidados → novos ativos RF (LCAs + LCD BRDE)</td>
              <td className="r">R$267.000</td>
              <td className="r">+1,83%/ano</td>
              <td className="r good"><strong>+R$ 407/mês</strong></td>
            </tr>
            <tr style={{ background: "#f8f9ff" }}>
              <td><strong>Total combinado</strong></td>
              <td className="r"><strong>R$379.124</strong></td>
              <td className="r">—</td>
              <td className="r good" style={{ fontSize: 15 }}><strong>+R$ 692/mês</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

// prevent unused warning
export const __fmtR = fmtR;
