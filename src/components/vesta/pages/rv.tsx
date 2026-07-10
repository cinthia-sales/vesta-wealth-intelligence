import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ── dados das posições de Paulo ── */
const POS = [
  { id: "pssa3",  ticker: "PSSA3",  empresa: "Porto Seguro", qtd: 544,  pm: 26.95, cotacao: 53.30, dy: 5, divRec: 0 },
  { id: "itsa4",  ticker: "ITSA4",  empresa: "Itaúsa",       qtd: 1576, pm: 8.87,  cotacao: 13.42, dy: 6, divRec: 0 },
  { id: "vale3",  ticker: "VALE3",  empresa: "Vale",          qtd: 200,  pm: 87.15, cotacao: 72.81, dy: 8, divRec: 6500 },
  { id: "bpac11", ticker: "BPAC11", empresa: "BTG Pactual",  qtd: 342,  pm: 86.85, cotacao: 54.48, dy: 3, divRec: 0 },
  { id: "outros", ticker: "ITUB4+", empresa: "Itaú + Outros",qtd: null as number | null, pm: null as number | null, cotacao: null as number | null, dy: 6, divRec: 0, valTotal: 12362 },
] as const;

type Pos = (typeof POS)[number];

const SELIC_DEF = [13.5, 12.5, 11.0, 9.5, 9.0, 9.0, 9.0, 9.0, 9.0, 9.0];
const ANO_LABELS = ["2026","2027","2028","2029","2030","2031","2032","2033","2034","2035"];

/* ── formatters ── */
const fmtR  = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");
const fmtP  = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number) => (v * 100).toFixed(1) + "%";

/* ── veredito ── */
function verdict(cagr: number | null): { t: string; c: string } {
  if (cagr === null || cagr < 0.055) return { t: "MANTER",    c: "rv-g" };
  if (cagr < 0.075)                   return { t: "MONITORAR", c: "rv-w" };
  return                                     { t: "MIGRAR",    c: "rv-r" };
}

/* ── multiplicador LCI acumulado ── */
function lciMult(hz: number, selic: number[]): number {
  let f = 1;
  for (let i = 0; i < hz; i++) {
    const s = selic[i] ?? 9;
    const lci = (s - 0.1) * 0.89 / 100;
    f *= 1 + lci;
  }
  return f;
}

type CalcResult = {
  p: Pos;
  valAt: number;
  lciAlvo: number;
  divProj: number;
  cagr: number | null;
  bkPrice: number | null;
  resPct: number | null;
  v: { t: string; c: string };
};

function compute(
  hz: number,
  selic: number[],
  cotacoes: Record<string, number>,
  dys: Record<string, number>,
): CalcResult[] {
  const mult = lciMult(hz, selic);
  return POS.map((p) => {
    const cotV  = cotacoes[p.id] ?? (p.qtd ? (p.cotacao ?? 0) : ((p as { valTotal?: number }).valTotal ?? 0));
    const dyV   = dys[p.id] ?? p.dy;
    const valAt = p.qtd ? cotV * p.qtd : cotV;
    const lciAlvo = valAt * mult;
    const divProj = valAt * (dyV / 100) * hz;
    const net = Math.max(lciAlvo - divProj, 0);
    let cagr: number | null = null;
    if (valAt > 0 && net > 0) cagr = Math.pow(net / valAt, 1 / hz) - 1;
    const bkPrice = p.qtd && cotV > 0 && net > 0 ? net / p.qtd : null;
    const resPct = p.pm && cotV > 0 && p.qtd ? (cotV / p.pm - 1) * 100 : null;
    return { p, valAt, lciAlvo, divProj, cagr, bkPrice, resPct, v: verdict(cagr) };
  });
}

/* ── SVG chart ── */
function RVChart({ rows, hz }: { rows: CalcResult[]; hz: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(420);

  useEffect(() => {
    if (!ref.current) return;
    setW(ref.current.offsetWidth || 420);
    const ro = new ResizeObserver(() => setW(ref.current?.offsetWidth || 420));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const H = 190;
  const pad = { l: 54, r: 10, t: 10, b: 30 };
  const iW = w - pad.l - pad.r;
  const iH = H - pad.t - pad.b;
  const maxV = Math.max(...rows.map((r) => Math.max(r.valAt, r.lciAlvo)), 1);
  const bW = 14;
  const n = rows.length;
  const grpW = bW * 2 + 5;
  const spacing = (iW - n * grpW) / (n + 1);

  const px = (g: number, b: number) => pad.l + spacing * (g + 1) + g * grpW + b * (bW + 5);
  const py = (v: number) => pad.t + (1 - v / maxV) * iH;
  const bh = (v: number) => (v / maxV) * iH;

  const COL: Record<string, string> = { "rv-g": "#5B8A6A", "rv-w": "#B8892A", "rv-r": "#A85555" };

  const bars = rows.map(({ p, valAt, lciAlvo, v }, g) => {
    const col = COL[v.c] ?? "#B8892A";
    const x1 = px(g, 0), x2 = px(g, 1);
    return (
      <g key={p.id}>
        <rect x={x1} y={py(valAt)}  width={bW} height={bh(valAt)}  fill={col}       opacity={0.8} rx={2} />
        <rect x={x2} y={py(lciAlvo)} width={bW} height={bh(lciAlvo)} fill="#C4952A" opacity={0.4} rx={2} />
        <text x={x1 + bW - 2} y={H - pad.b + 12} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)">{p.ticker}</text>
      </g>
    );
  });

  const grid = [0.25, 0.5, 0.75, 1].map((f) => {
    const y = pad.t + (1 - f) * iH;
    return (
      <g key={f}>
        <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} />
        <text x={pad.l - 5} y={y + 3} textAnchor="end" fontSize={9} fill="var(--muted-foreground)">R${Math.round(maxV * f / 1000)}k</text>
      </g>
    );
  });

  const ly = H - 2;

  return (
    <div ref={ref}>
      <svg width={w} height={H} style={{ width: "100%", display: "block", overflow: "visible" }}>
        {grid}
        {bars}
        <rect x={pad.l}      y={ly - 7} width={10} height={7} fill="#5B8A6A" opacity={0.8} rx={1} />
        <text x={pad.l + 13} y={ly} fontSize={9} fill="var(--muted-foreground)">Atual</text>
        <rect x={pad.l + 50} y={ly - 7} width={10} height={7} fill="#C4952A" opacity={0.4} rx={1} />
        <text x={pad.l + 63} y={ly} fontSize={9} fill="var(--muted-foreground)">LCI {hz}a</text>
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════
   PAGE COMPONENT
══════════════════════════════════════ */
export function RVPage() {
  const [hz, setHz] = useState(5);
  const [selic, setSelic] = useState<number[]>([...SELIC_DEF]);
  const [cotacoes, setCotacoes] = useState<Record<string, number>>({});
  const [dys, setDys] = useState<Record<string, number>>({});

  const getVal = useCallback(
    (p: Pos) => cotacoes[p.id] ?? (p.qtd ? (p.cotacao ?? 0) : ((p as { valTotal?: number }).valTotal ?? 0)),
    [cotacoes],
  );
  const getDy = useCallback((p: Pos) => dys[p.id] ?? p.dy, [dys]);

  const rows = useMemo(
    () => compute(hz, selic, cotacoes, dys),
    [hz, selic, cotacoes, dys],
  );

  const totRV  = rows.reduce((s, r) => s + r.valAt, 0);
  const totLCI = rows.reduce((s, r) => s + r.lciAlvo, 0);
  const { cagrNum, cagrDen } = rows.reduce(
    (acc, r) => r.cagr !== null ? { cagrNum: acc.cagrNum + r.cagr * r.valAt, cagrDen: acc.cagrDen + r.valAt } : acc,
    { cagrNum: 0, cagrDen: 0 },
  );

  const RECO: Record<string, string> = {
    MANTER:    "Fundamentos justificam manter. Revisar se CAGR real ficar abaixo da meta por 2 trimestres.",
    MONITORAR: "Meta exige atenção. Definir gatilho de saída e revisar trimestralmente.",
    MIGRAR:    "Custo de oportunidade alto vs LCI garantida. Avaliar migração para RF.",
  };

  /* estilos inline reutilizados */
  const badge = (cls: string, text: string) => (
    <span style={{
      padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600, letterSpacing: ".04em",
      background: cls === "rv-g" ? "var(--success-muted, #F0F6F2)" : cls === "rv-w" ? "#FDF8EA" : "#FAF1F1",
      color: cls === "rv-g" ? "#5B8A6A" : cls === "rv-w" ? "#B8892A" : "#A85555",
    }}>{text}</span>
  );

  return (
    <div>
      {/* ── page header ── */}
      <div className="ph">
        <h1>Renda Variável — Custo de Oportunidade</h1>
        <p>Compare cada posição contra o benchmark LCI 89%&nbsp;CDI e decida: manter, monitorar ou migrar.</p>
      </div>

      {/* ── banner sunk cost ── */}
      <div style={{
        background: "#FDF8EA", borderLeft: "3px solid #B8892A", borderRadius: "4px 8px 8px 4px",
        padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#8A6420", lineHeight: 1.6,
      }}>
        <strong>Custo afundado (sunk cost):</strong> O preço médio de compra não importa para a decisão de hoje.
        O que importa: dado o valor <em>atual</em> de cada posição, qual uso desse capital gera mais riqueza?
        Esta análise compara <strong>valor de mercado hoje</strong> vs{" "}
        <strong>melhor alternativa disponível</strong> (LCI 89%&nbsp;CDI).
      </div>

      {/* ── controles ── */}
      <div className="card" style={{ marginBottom: 14, padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", fontSize: 13 }}>
          <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>Horizonte:</span>
          <div style={{ display: "flex", gap: 3 }}>
            {[3, 5, 7, 10].map((n) => (
              <button
                key={n}
                onClick={() => setHz(n)}
                style={{
                  padding: "4px 13px", border: "1px solid var(--border)", borderRadius: 6,
                  background: hz === n ? "var(--primary, #C4952A)" : "var(--background)",
                  color: hz === n ? "#fff" : "var(--foreground)",
                  fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                }}
              >{n} anos</button>
            ))}
          </div>
          <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>LCI haircut: <strong>89% CDI</strong></span>
        </div>

        {/* curva selic */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 8 }}>
            Curva Selic projetada (% a.a.) — editável:
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SELIC_DEF.map((def, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <label style={{ fontSize: 9, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                  {ANO_LABELS[i]}
                </label>
                <input
                  type="number" value={selic[i] ?? def} step={0.25} min={4} max={25}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setSelic((prev) => { const n = [...prev]; n[i] = isNaN(v) ? def : v; return n; });
                  }}
                  style={{
                    width: 54, padding: "4px 5px", border: "1px solid var(--border)", borderRadius: 5,
                    fontSize: 12, textAlign: "center", color: "var(--foreground)", background: "var(--background)",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="kpi-row" style={{ marginBottom: 14 }}>
        <div className="kpi">
          <div className="kpi-l">Total RV hoje</div>
          <div className="kpi-v blue">{fmtR(totRV)}</div>
          <div className="kpi-s">5 posições</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">LCI equivalente</div>
          <div className="kpi-v warn">{fmtR(totLCI)}</div>
          <div className="kpi-s">em {hz} anos</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Gap de oportunidade</div>
          <div className="kpi-v bad">− {fmtR(totLCI - totRV)}</div>
          <div className="kpi-s">custo de ficar em RV</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">CAGR médio necessário</div>
          <div className="kpi-v">{cagrDen > 0 ? fmtPct(cagrNum / cagrDen) + " a.a." : "—"}</div>
          <div className="kpi-s">ponderado pelo capital</div>
        </div>
      </div>

      {/* ── tabela ── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Posições{" "}
          <span>edite cotação atual e DY estimado — recalcula automaticamente</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Ativo","Qtd","PM","Cotação / Val. ✎","Val. mercado","Resultado","DY % ✎","Div. proj.","LCI alvo","CAGR nec.","Preço alvo","Veredito"].map((h, i) => (
                  <th key={h} style={{
                    padding: "7px 10px", textAlign: i === 0 ? "left" : "right",
                    fontSize: 10, color: "var(--muted-foreground)", fontWeight: 500,
                    borderBottom: "2px solid var(--border)", whiteSpace: "nowrap", letterSpacing: ".04em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, valAt, lciAlvo, divProj, cagr, bkPrice, resPct, v }) => {
                const inputVal = p.qtd ? (getVal(p)) : (getVal(p));
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "9px 10px", textAlign: "left" }}>
                      <strong style={{ fontFamily: "var(--font-serif, serif)", fontSize: 13 }}>{p.ticker}</strong>
                      <span style={{ display: "block", color: "var(--muted-foreground)", fontSize: 10, marginTop: 1 }}>{p.empresa}</span>
                    </td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}>{p.qtd?.toLocaleString("pt-BR") ?? "—"}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}>{p.pm ? fmtP(p.pm) : "—"}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}>
                      <input
                        type="number" value={inputVal} step={p.qtd ? 0.01 : 100} min={0}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setCotacoes((prev) => ({ ...prev, [p.id]: isNaN(v) ? 0 : v }));
                        }}
                        style={{
                          width: 90, padding: "4px 6px", border: "1px solid var(--border)", borderRadius: 5,
                          fontSize: 12, textAlign: "right", color: "var(--foreground)", background: "var(--background)",
                          fontFamily: "inherit",
                        }}
                      />
                    </td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}>{fmtR(valAt)}</td>
                    <td style={{
                      padding: "9px 10px", textAlign: "right",
                      color: resPct === null ? undefined : resPct >= 0 ? "#5B8A6A" : "#A85555",
                    }}>
                      {resPct !== null ? (resPct >= 0 ? "+" : "") + resPct.toFixed(1) + "%" : "—"}
                    </td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}>
                      <input
                        type="number" value={getDy(p)} step={0.5} min={0} max={30}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setDys((prev) => ({ ...prev, [p.id]: isNaN(v) ? 0 : v }));
                        }}
                        style={{
                          width: 56, padding: "4px 6px", border: "1px solid var(--border)", borderRadius: 5,
                          fontSize: 12, textAlign: "right", color: "var(--foreground)", background: "var(--background)",
                          fontFamily: "inherit",
                        }}
                      />%
                    </td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}>{fmtR(divProj)}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}>{fmtR(lciAlvo)}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}>
                      {cagr !== null ? fmtPct(cagr) + " a.a." : <span style={{ color: "#5B8A6A" }}>div. cobrem</span>}
                    </td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}>{bkPrice !== null ? fmtP(bkPrice) : "—"}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}>{badge(v.c, v.t)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 8 }}>
          * ITUB4+: campo cotação recebe o <em>valor total</em> de mercado (posição agrupada) ·
          Div. proj. = DY × val. atual × anos (estimativa simples)
        </div>
      </div>

      {/* ── gráfico + recomendações ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div className="card">
          <div className="card-hdr">Valor atual vs LCI alvo <span>{hz} anos</span></div>
          <RVChart rows={rows} hz={hz} />
        </div>
        <div className="card">
          <div className="card-hdr">Recomendações por posição</div>
          {rows.map(({ p, v, cagr }) => (
            <div key={p.id} style={{
              padding: "10px 0", borderBottom: "1px solid var(--border)",
              fontSize: 12, display: "flex", gap: 10, alignItems: "flex-start", lineHeight: 1.55,
            }}>
              <strong style={{ minWidth: 58, fontFamily: "var(--font-serif, serif)", fontSize: 13 }}>{p.ticker}</strong>
              <span>
                {badge(v.c, v.t)}{" "}
                <span style={{ marginLeft: 6 }}>{RECO[v.t]}</span>
                {cagr !== null && (
                  <strong style={{ color: "#B8892A", marginLeft: 4 }}>{fmtPct(cagr)}/ano nec.</strong>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── alerta BPAC11 ── */}
      {rows.find((r) => r.p.id === "bpac11")?.v.t === "MIGRAR" && (
        <div style={{
          background: "#FAF1F1", border: "1px solid #d4a0a0", borderRadius: 8,
          padding: 16, marginBottom: 24,
        }}>
          <div style={{ color: "#A85555", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            ⚠ Ação prioritária — BPAC11
          </div>
          <div style={{ fontSize: 12, color: "#8A4545", lineHeight: 1.7 }}>
            Capital em BPAC11 hoje: <strong>{fmtR(rows.find((r) => r.p.id === "bpac11")!.valAt)}</strong><br />
            Se migrar para LCI agora → em {hz} anos: <strong style={{ color: "#5B8A6A" }}>{fmtR(rows.find((r) => r.p.id === "bpac11")!.lciAlvo)}</strong> (garantido)<br />
            Para BPAC11 igualar isso → precisa chegar a{" "}
            <strong style={{ color: "#A85555" }}>
              {rows.find((r) => r.p.id === "bpac11")!.bkPrice !== null
                ? fmtP(rows.find((r) => r.p.id === "bpac11")!.bkPrice!)
                : "—"}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
