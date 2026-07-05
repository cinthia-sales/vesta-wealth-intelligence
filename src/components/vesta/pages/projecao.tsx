import { useMemo, useState } from "react";

import { getUser } from "@/data/vesta-users";
import type { ProfileId } from "@/lib/profile-derive";

function fmtR(n: number) {
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}
function fmtRk(n: number) {
  return "R$ " + Math.round(n / 1000).toLocaleString("pt-BR") + "k";
}

type Cenario = "otimista" | "base" | "pessimista";
type Freq = "mensal" | "semestral" | "anual";

const FREQS: { id: Freq; label: string; perYear: number; max: number; step: number; sufixo: string }[] = [
  { id: "mensal", label: "Mensal", perYear: 12, max: 35000, step: 500, sufixo: "mês" },
  { id: "semestral", label: "Semestral", perYear: 2, max: 210000, step: 1000, sufixo: "sem" },
  { id: "anual", label: "Anual", perYear: 1, max: 420000, step: 1000, sufixo: "ano" },
];

// Curvas de CDI anual (%) por ano — 2026 até 2036
const CURVAS: Record<Cenario, number[]> = {
  //          26    27    28    29    30    31    32    33    34    35    36
  otimista: [14.75, 13.5, 12.0, 11.0, 10.5, 10.0, 9.5, 9.5, 9.5, 9.5, 9.5],
  base:     [14.75, 12.5, 10.5,  9.5,  9.0,  8.5, 8.5, 8.5, 8.5, 8.5, 8.5],
  pessimista:[14.75, 11.0,  9.0,  8.0,  7.5,  7.0, 7.0, 7.0, 7.0, 7.0, 7.0],
};
// IPCA projetado (%) — usado nas NTN-B (cupom + IPCA)
const IPCA: Record<Cenario, number[]> = {
  otimista:  [5.5, 4.5, 4.0, 3.8, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5],
  base:      [5.5, 5.0, 4.5, 4.2, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0],
  pessimista:[5.5, 5.8, 5.5, 5.2, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0],
};

// Classificação simplificada dos ativos por tipo de indexador
type Bucket = "posfix" | "inflacao" | "prefix" | "rv";
function classify(nome: string): Bucket {
  if (/NTN-B|IPCA|Jalles/i.test(nome)) return "inflacao";
  if (/CDI|LCA|LCI|LCD|XPAG|LFTB/i.test(nome)) return "posfix";
  if (/DEB|J&F|prefix/i.test(nome)) return "prefix";
  return "rv";
}
// Taxa efetiva anual por bucket, dado CDI/IPCA do ano
function taxaAno(b: Bucket, cdi: number, ipca: number, cdiPct: number, cupomIpca: number, cupomPre: number) {
  switch (b) {
    case "posfix": return (cdi * cdiPct) / 100; // ex.: 92% CDI
    case "inflacao": return ipca + cupomIpca; // ex.: IPCA + 8%
    case "prefix": return cupomPre; // fixo
    case "rv": return 0; // não projetamos RV (volátil demais)
  }
}

export function ProjecaoPage({ profileId }: { profileId: ProfileId }) {
  const u = getUser(profileId);
  const [cenario, setCenario] = useState<Cenario>("base");
  const [freq, setFreq] = useState<Freq>("mensal");
  const [aporte, setAporte] = useState(0);
  const [bonus, setBonus] = useState(0); // aporte pontual único (PLR, férias)
  const [bonusAno, setBonusAno] = useState(2027); // ano em que o bônus entra
  const freqCfg = FREQS.find((f) => f.id === freq) ?? FREQS[0];
  const aporteMensalEq = (aporte * freqCfg.perYear) / 12;

  const { serie, breakdown } = useMemo(() => {
    // Agrupar RF por bucket com taxa característica
    type Pos = { bucket: Bucket; v: number; cdiPct: number; cupomIpca: number; cupomPre: number };
    const pos: Pos[] = u.rf_ativos.map((a) => {
      const b = classify(a.n);
      return {
        bucket: b,
        v: a.v,
        cdiPct: a.cdi ?? 100,
        cupomIpca: /IPCA\+9,45/.test(a.n) ? 9.45 : /IPCA\+8,5/.test(a.n) ? 8.5 : /IPCA\+4,45/.test(a.n) ? 4.45 : /IPCA\+4,65/.test(a.n) ? 4.65 : 5,
        cupomPre: /15,15/.test(a.n) ? 15.15 : 12,
      };
    });
    // RV: assumir taxa média 10% aa (simplificação)
    const rvBase = u.rv;

    const curvaCdi = CURVAS[cenario];
    const curvaIpca = IPCA[cenario];
    const serie: { ano: number; total: number; rf: number; rv: number }[] = [];
    const posEvol = pos.map((p) => ({ ...p }));
    let rvVal = rvBase;

    serie.push({ ano: 2026, total: u.total, rf: u.rf, rv: rvBase });

    let bonusAcum = 0;
    for (let i = 1; i <= 10; i++) {
      const anoAtual = 2026 + i;
      const cdi = curvaCdi[i] ?? curvaCdi[curvaCdi.length - 1];
      const ipca = curvaIpca[i] ?? curvaIpca[curvaIpca.length - 1];
      posEvol.forEach((p) => {
        const t = taxaAno(p.bucket, cdi, ipca, p.cdiPct, p.cupomIpca, p.cupomPre);
        p.v = p.v * (1 + t / 100);
      });
      rvVal = rvVal * 1.1; // 10% aa
      // bônus pontual: entra uma única vez no ano escolhido e depois rende
      if (anoAtual === bonusAno) bonusAcum += bonus;
      bonusAcum = bonusAcum * (1 + (cdi * 0.9) / 100);
      const rfTotal = posEvol.reduce((s, p) => s + p.v, 0);
      const aporteAno = aporteMensalEq * 12 * i; // aportes acumulados vão pra CDI base
      const total = rfTotal + rvVal + aporteAno * Math.pow(1 + (cdi * 0.9) / 100, 0.5) + bonusAcum;
      serie.push({ ano: anoAtual, total, rf: rfTotal + aporteAno + bonusAcum, rv: rvVal });
    }

    // Breakdown por bucket no ano final
    const breakdown: Record<Bucket, number> = { posfix: 0, inflacao: 0, prefix: 0, rv: rvVal };
    posEvol.forEach((p) => { breakdown[p.bucket] += p.v; });

    return { serie, breakdown };
  }, [u, cenario, aporteMensalEq, bonus, bonusAno]);

  const maxV = Math.max(...serie.map((s) => s.total));
  const minV = Math.min(...serie.map((s) => s.total));
  const W = 640, H = 220, PL = 60, PR = 12, PT = 12, PB = 26;
  const xs = (i: number) => PL + (i / (serie.length - 1)) * (W - PL - PR);
  const ys = (v: number) => PT + (1 - (v - minV) / (maxV - minV || 1)) * (H - PT - PB);
  const path = serie.map((s, i) => (i ? "L" : "M") + xs(i) + " " + ys(s.total)).join(" ");
  const area = path + ` L ${xs(serie.length - 1)} ${H - PB} L ${xs(0)} ${H - PB} Z`;

  const finalTotal = serie[serie.length - 1].total;
  const cagr = (Math.pow(finalTotal / u.total, 1 / 10) - 1) * 100;

  const cb = (id: Cenario, label: string) => (
    <button className={"fbtn" + (cenario === id ? " on" : "")} onClick={() => setCenario(id)}>
      {label}
    </button>
  );

  return (
    <>
      <div className="ph">
        <h1>Projeção de patrimônio</h1>
        <p>
          Simulação até 2036 com curva de CDI/IPCA por cenário. Cada ativo evolui pela sua taxa
          característica (pós-fix reage à queda do CDI, inflação segue IPCA+cupom, prefixado fixo).
        </p>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-l">Hoje</div>
          <div className="kpi-v blue">{fmtR(u.total)}</div>
          <div className="kpi-s">02/07/2026</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Em 2036 (10 anos)</div>
          <div className="kpi-v good">{fmtR(finalTotal)}</div>
          <div className="kpi-s">cenário {cenario}</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">CAGR médio</div>
          <div className="kpi-v good">{cagr.toFixed(2)}% a.a.</div>
          <div className="kpi-s">geométrico 2026→2036</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Ganho no período</div>
          <div className="kpi-v good">{fmtR(finalTotal - u.total)}</div>
          <div className="kpi-s">
            {aporte > 0 ? `+ aportes ${fmtR(aporte)}/${freqCfg.sufixo}` : "sem aporte adicional"}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Cenário e aportes <span>selecione a curva de CDI/IPCA</span>
        </div>
        <div className="filter-row">
          {cb("otimista", "Otimista (CDI cai devagar)")}
          {cb("base", "Base (curva de mercado)")}
          {cb("pessimista", "Pessimista (CDI despenca)")}
        </div>
        <div className="filter-row" style={{ marginTop: 8 }}>
          {FREQS.map((f) => (
            <button
              key={f.id}
              className={"fbtn" + (freq === f.id ? " on" : "")}
              onClick={() => { setFreq(f.id); setAporte(0); }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, fontSize: 13 }}>
          <label>Aporte adicional ({freqCfg.sufixo}):</label>
          <input
            type="range"
            min={0}
            max={freqCfg.max}
            step={freqCfg.step}
            value={aporte}
            onChange={(e) => setAporte(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <strong style={{ minWidth: 112, textAlign: "right" }}>{fmtR(aporte)}/{freqCfg.sufixo}</strong>
        </div>
        {freq !== "mensal" && (
          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12, textAlign: "right" }}>
            Equivalente a {fmtR(aporteMensalEq)}/mês
          </div>
        )}
        <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 12, textAlign: "right" }}>
          Limite: {fmtR(freqCfg.max)}/{freqCfg.sufixo}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">Curva de patrimônio 2026→2036</div>
        <div className="chart-c" style={{ height: 260 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }}>
            <path d={area} fill="rgba(161,29,62,.10)" />
            <path d={path} fill="none" stroke="#A11D3E" strokeWidth={2.2} />
            {serie.map((s, i) => (
              <g key={s.ano}>
                <circle cx={xs(i)} cy={ys(s.total)} r={3} fill="#A11D3E" />
                {i % 2 === 0 && (
                  <text x={xs(i)} y={H - 8} fontSize={10} textAnchor="middle" fill="var(--muted)">
                    {s.ano}
                  </text>
                )}
              </g>
            ))}
            {[0, 0.5, 1].map((f) => {
              const v = minV + f * (maxV - minV);
              return (
                <g key={f}>
                  <line x1={PL} x2={W - PR} y1={ys(v)} y2={ys(v)} stroke="rgba(0,0,0,.06)" />
                  <text x={PL - 6} y={ys(v) + 3} fontSize={10} textAnchor="end" fill="var(--muted)">
                    {fmtRk(v)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">Composição em 2036 · como cada bloco reagiu</div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Bloco</th>
              <th className="r">Hoje</th>
              <th className="r">2036 ({cenario})</th>
              <th className="r">Crescimento</th>
              <th>Comportamento</th>
            </tr>
          </thead>
          <tbody>
            <BucketRow label="Pós-fixado (LCAs / LCDs / XPAG)" bucket="posfix" u={u} v={breakdown.posfix} nota="rende menos quando CDI cai" />
            <BucketRow label="Inflação (NTN-B + Jalles IPCA+)" bucket="inflacao" u={u} v={breakdown.inflacao} nota="protege da inflação · taxa real trava" />
            <BucketRow label="Prefixado (DEB J&F +15,15%)" bucket="prefix" u={u} v={breakdown.prefix} nota="melhor bloco em queda de CDI" />
            {u.rv > 0 && (
              <tr>
                <td>Renda variável (ações + ETFs)</td>
                <td className="r">{fmtR(u.rv)}</td>
                <td className="r">{fmtR(breakdown.rv)}</td>
                <td className="r good">+{Math.round(((breakdown.rv / u.rv) - 1) * 100)}%</td>
                <td><span style={{ color: "var(--muted)", fontSize: 12 }}>10% a.a. simplificado</span></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-hdr">Leitura estratégica</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text)" }}>
          <p>
            <strong>Cenário base:</strong> Selic caindo para ~8,5% até 2030 e ficando lá. Pós-fixados
            (LCAs/LCDs) passam a render ~8% a.a., enquanto NTN-B IPCA+ e a DEB J&F +15,15% continuam
            travadas na taxa alta — <em>por isso a projeção premia quem trava agora</em>.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>Otimista:</strong> CDI cai devagar, pós-fix ainda rende bem. <strong>Pessimista:</strong>{" "}
            CDI cai forte, pós-fix vira o pior bloco — reforça a tese de trocar o LCD BRDE 2036 assim
            que houver janela no secundário.
          </p>
          <p style={{ marginTop: 8, color: "var(--muted)", fontSize: 12 }}>
            Premissas: pós-fixado usa %CDI de cada título; inflação usa cupom do próprio título +
            IPCA da curva; prefixado é vitalício até o vencimento. RV projetada a 10% a.a.
            simplificado (não substitui análise de ações).
          </p>
        </div>
      </div>
    </>
  );
}

function BucketRow({ label, bucket, u, v, nota }: {
  label: string; bucket: Bucket; u: ReturnType<typeof getUser>; v: number; nota: string;
}) {
  const hoje = u.rf_ativos.filter((a) => classify(a.n) === bucket).reduce((s, a) => s + a.v, 0);
  if (hoje === 0) return null;
  const growth = ((v / hoje) - 1) * 100;
  return (
    <tr>
      <td>{label}</td>
      <td className="r">{fmtR(hoje)}</td>
      <td className="r">{fmtR(v)}</td>
      <td className={"r " + (growth > 0 ? "good" : "bad")}>{growth > 0 ? "+" : ""}{growth.toFixed(0)}%</td>
      <td><span style={{ color: "var(--muted)", fontSize: 12 }}>{nota}</span></td>
    </tr>
  );
}
