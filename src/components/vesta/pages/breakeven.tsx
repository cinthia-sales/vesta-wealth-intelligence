import { useEffect, useMemo, useState } from "react";
import type { ProfileId } from "@/lib/profile-derive";

function fmtR(n: number) {
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}

function fmtRk(n: number) {
  if (Math.abs(n) >= 1_000_000) return "R$ " + (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return "R$ " + Math.round(n / 1_000) + "k";
  return "R$ " + Math.round(n);
}

function ChartAxes({
  minV, maxV, maxMonth, W, H, PL, PR, PT, PB, xs, ys,
}: {
  minV: number; maxV: number; maxMonth: number;
  W: number; H: number; PL: number; PR: number; PT: number; PB: number;
  xs: (m: number) => number; ys: (v: number) => number;
}) {
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => minV + f * (maxV - minV));
  const xStep = maxMonth <= 24 ? 6 : maxMonth <= 60 ? 12 : 24;
  const xTicks: number[] = [];
  for (let m = 0; m <= maxMonth; m += xStep) xTicks.push(m);
  return (
    <g>
      {yTicks.map((v, i) => (
        <g key={"y" + i}>
          <line x1={PL} x2={W - PR} y1={ys(v)} y2={ys(v)} stroke="rgba(0,0,0,.06)" />
          <text x={PL - 6} y={ys(v) + 3} fontSize={10} textAnchor="end" fill="var(--muted)">
            {fmtRk(v)}
          </text>
        </g>
      ))}
      <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke="rgba(0,0,0,.15)" />
      <line x1={PL} x2={PL} y1={PT} y2={H - PB} stroke="rgba(0,0,0,.15)" />
      {xTicks.map((m) => (
        <g key={"x" + m}>
          <line x1={xs(m)} x2={xs(m)} y1={H - PB} y2={H - PB + 3} stroke="rgba(0,0,0,.25)" />
          <text x={xs(m)} y={H - PB + 14} fontSize={10} textAnchor="middle" fill="var(--muted)">
            {m}m
          </text>
        </g>
      ))}
    </g>
  );
}

// ---- Dados reais consolidados (Paulo, pré-carregado) --------------------
const PAULO_DATA = {
  custo: 14698,
  ganho: 692,
  ativos: [
    {
      nome: "Debêntures",
      fonte: "Debêntures novas vs antigas (J&F + Jalles vs Itapoá + Localiza)",
      capital: 112124,
      ganhoTaxa: "+3,05%/ano",
      ganhoMes: 285,
      custoIsolado: 13648,   // deságio na venda das antigas
      taxaReinvest: 0.1486,  // taxa contratada das novas debêntures (compõe o ganho)
    },
    {
      nome: "Renda fixa",
      fonte: "Fundos liquidados → novos ativos RF (LCAs + LCD BRDE)",
      capital: 267000,
      ganhoTaxa: "+1,83%/ano",
      ganhoMes: 407,
      custoIsolado: 1050,    // IR na liquidação dos fundos
      taxaReinvest: 0.1333,  // taxa média das LCAs/LCD (compõe o ganho)
    },
  ],
  linhas: { tA: 0.1181, tB: 0.1486, cA: 125772, cB: 112124 },
  inicio: { ano: 2026, mes: 6 },
};

// Ganho acumulado com juros compostos (ganho mensal reinvestido na taxa nova)
// FV(m) = ganhoMes * ((1+r_m)^m - 1) / r_m
function ganhoAcumulado(ganhoMes: number, taxaAno: number, m: number) {
  const rm = taxaAno / 12;
  if (rm <= 0) return ganhoMes * m;
  return (ganhoMes * (Math.pow(1 + rm, m) - 1)) / rm;
}

function mesesBreakevenComposto(custo: number, ganhoMes: number, taxaAno: number) {
  if (ganhoMes <= 0 || custo <= 0) return Infinity;
  const rm = taxaAno / 12;
  if (rm <= 0) return custo / ganhoMes;
  const arg = 1 + (custo * rm) / ganhoMes;
  if (arg <= 1) return Infinity;
  return Math.log(arg) / Math.log(1 + rm);
}

// Mini-gráfico: custo (linha vermelha plana) vs ganho acumulado (linha azul crescente).
// Cruzam exatamente no mês custo / ganhoMes — bate com o KPI.
function GraficoCustoGanho({
  custo, ganhoMes, titulo, sub,
}: {
  custo: number; ganhoMes: number; titulo: string; sub?: string;
}) {
  const mesesCross = ganhoMes > 0 ? custo / ganhoMes : Infinity;
  const horizonte = isFinite(mesesCross)
    ? Math.max(12, Math.min(96, Math.ceil(mesesCross * 1.8)))
    : 60;
  const maxV = Math.max(custo * 1.15, ganhoMes * horizonte);
  const minV = 0;
  const W = 600, H = 200, PL = 60, PR = 12, PT = 10, PB = 34;
  const xs = (m: number) => PL + (m / horizonte) * (W - PL - PR);
  const ys = (v: number) => PT + (1 - (v - minV) / (maxV - minV)) * (H - PT - PB);
  const yCusto = ys(custo);
  const pathGanho =
    `M ${xs(0)} ${ys(0)} L ${xs(horizonte)} ${ys(ganhoMes * horizonte)}`;
  const mCross = isFinite(mesesCross) && mesesCross <= horizonte ? mesesCross : null;
  return (
    <div className="card">
      <div className="card-hdr">
        {titulo} {sub && <span>{sub}</span>}
      </div>
      <div className="chart-c" style={{ height: 220 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }}>
          <ChartAxes
            minV={minV} maxV={maxV} maxMonth={horizonte}
            W={W} H={H} PL={PL} PR={PR} PT={PT} PB={PB} xs={xs} ys={ys}
          />
          {/* Custo (linha vermelha horizontal) */}
          <line
            x1={xs(0)} x2={xs(horizonte)} y1={yCusto} y2={yCusto}
            stroke="#dc2626" strokeWidth={2}
          />
          {/* Ganho acumulado (linha azul crescente) */}
          <path d={pathGanho} fill="none" stroke="#4f8ef7" strokeWidth={2} />
          {mCross !== null && (
            <>
              <line
                x1={xs(mCross)} x2={xs(mCross)} y1={PT} y2={H - PB}
                stroke="var(--accent)" strokeDasharray="3 3" strokeWidth={1}
              />
              <circle cx={xs(mCross)} cy={yCusto} r={4} fill="var(--accent)" />
              <text
                x={xs(mCross) + 6} y={yCusto - 8}
                fontSize={11} fill="var(--accent)" fontWeight={600}
              >
                m{Math.ceil(mCross)} · {fmtRk(custo)}
              </text>
            </>
          )}
        </svg>
      </div>
      <div style={{ display: "flex", gap: 18, marginTop: 10, fontSize: 12, color: "var(--muted)", flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ display: "inline-block", width: 18, height: 2, background: "#dc2626" }} />
          Custo do movimento ({fmtR(custo)})
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ display: "inline-block", width: 18, height: 2, background: "#4f8ef7" }} />
          Ganho acumulado (+{fmtR(ganhoMes)}/mês)
        </span>
      </div>
    </div>
  );
}

function BreakevenConsolidado({ data }: { data: typeof PAULO_DATA }) {
  const { custo, ganho, ativos, inicio } = data;
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

      <div className="card" style={{ padding: "14px 18px", marginBottom: 14, background: "#faf7f0" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 15, marginBottom: 4 }}>
          Como ler os gráficos
        </div>
        <p style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>
          Cada movimento tem seu próprio custo (linha vermelha, plana) e seu próprio ganho mensal
          (linha azul, subindo). O ponto onde elas se cruzam é o mês em que aquele movimento se paga
          sozinho. O terceiro gráfico soma tudo — é o que bate com o KPI de {mesesBreakeven} meses.
        </p>
      </div>

      <div className="g32" style={{ marginBottom: 14 }}>
        {ativos.map((a, i) => (
          <GraficoCustoGanho
            key={a.nome}
            custo={a.custoIsolado}
            ganhoMes={a.ganhoMes}
            titulo={`Movimento ${i + 1} — ${a.nome}`}
            sub={`isolado · ${a.ganhoTaxa}`}
          />
        ))}
      </div>

      <div className="g32">
        <GraficoCustoGanho
          custo={custo}
          ganhoMes={ganho}
          titulo="Consolidado — os dois movimentos juntos"
          sub={`custo total ÷ ganho total = ${mesesBreakeven}m`}
        />

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

// ---- Simulador unificado de trocas & breakeven ---------------------------
type LinhaGrupo = {
  id: string;
  desc: string;
  capital: number;
  taxaMercado: number; // %/ano (marcação a mercado)
  taxaCurva: number;   // %/ano (contratada / na curva)
  duration: number;    // anos
  prazoMeses: number;  // meses até vencimento
};

type BreakevenReal = {
  confirmadoEm: string;
  custo: number;
  grupoA: LinhaGrupo[];
  grupoB: LinhaGrupo[];
  nome: string;
};

function novaLinha(): LinhaGrupo {
  return {
    id: Math.random().toString(36).slice(2, 9),
    desc: "",
    capital: 0,
    taxaMercado: 0,
    taxaCurva: 0,
    duration: 0,
    prazoMeses: 0,
  };
}

function mediaPonderada(linhas: LinhaGrupo[], campo: "taxaMercado" | "taxaCurva" | "duration" | "prazoMeses") {
  const capTotal = linhas.reduce((s, l) => s + l.capital, 0);
  if (capTotal <= 0) return 0;
  return linhas.reduce((s, l) => s + l.capital * l[campo], 0) / capTotal;
}

function storageKey(profileId: ProfileId) {
  return `vesta.breakeven.confirmado.${profileId}`;
}

function carregarBreakeven(profileId: ProfileId): BreakevenReal | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(profileId));
    if (!raw) return null;
    return JSON.parse(raw) as BreakevenReal;
  } catch {
    return null;
  }
}

function salvarBreakeven(profileId: ProfileId, be: BreakevenReal | null) {
  if (typeof window === "undefined") return;
  if (be === null) window.localStorage.removeItem(storageKey(profileId));
  else window.localStorage.setItem(storageKey(profileId), JSON.stringify(be));
}

// ---- Cartão de linha (reutilizado para grupo A e B) ----------------------
function CartaoLinha({
  linha,
  idx,
  onChange,
  onRemove,
  removivel,
}: {
  linha: LinhaGrupo;
  idx: number;
  onChange: (patch: Partial<LinhaGrupo>) => void;
  onRemove: () => void;
  removivel: boolean;
}) {
  return (
    <div
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
        {removivel && (
          <button
            type="button"
            onClick={onRemove}
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
        Descrição
        <input
          type="text"
          value={linha.desc}
          placeholder="ex.: Deb Itapoá / LCA XP jun/28"
          onChange={(e) => onChange({ desc: e.target.value })}
        />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <label className="bk-field">
          Capital (R$)
          <input
            type="number"
            min={0}
            value={linha.capital || ""}
            onChange={(e) => onChange({ capital: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="bk-field">
          Prazo restante (meses)
          <input
            type="number"
            min={0}
            value={linha.prazoMeses || ""}
            onChange={(e) => onChange({ prazoMeses: Number(e.target.value) || 0 })}
          />
        </label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <label className="bk-field">
          Taxa a mercado (%/ano)
          <input
            type="number"
            step={0.01}
            value={linha.taxaMercado || ""}
            onChange={(e) => onChange({ taxaMercado: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="bk-field">
          Taxa na curva (%/ano)
          <input
            type="number"
            step={0.01}
            value={linha.taxaCurva || ""}
            onChange={(e) => onChange({ taxaCurva: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="bk-field">
          Duration (anos)
          <input
            type="number"
            step={0.1}
            value={linha.duration || ""}
            onChange={(e) => onChange({ duration: Number(e.target.value) || 0 })}
          />
        </label>
      </div>
    </div>
  );
}

// ---- Simulador principal -------------------------------------------------
function SimuladorTrocaBreakeven({
  profileId,
  breakevenExistente,
  onConfirmar,
  onDescartar,
}: {
  profileId: ProfileId;
  breakevenExistente: BreakevenReal | null;
  onConfirmar: (be: BreakevenReal) => void;
  onDescartar: () => void;
}) {
  const [custo, setCusto] = useState(breakevenExistente?.custo ?? 0);
  const [nome, setNome] = useState(breakevenExistente?.nome ?? "");
  const [grupoA, setGrupoA] = useState<LinhaGrupo[]>(
    breakevenExistente?.grupoA ?? [novaLinha()],
  );
  const [grupoB, setGrupoB] = useState<LinhaGrupo[]>(
    breakevenExistente?.grupoB ?? [novaLinha()],
  );

  const capitalA = grupoA.reduce((s, l) => s + l.capital, 0);
  const capitalB = grupoB.reduce((s, l) => s + l.capital, 0);

  const taxaMercadoA = mediaPonderada(grupoA, "taxaMercado") / 100;
  const taxaCurvaA = mediaPonderada(grupoA, "taxaCurva") / 100;
  const taxaMercadoB = mediaPonderada(grupoB, "taxaMercado") / 100;
  const taxaCurvaB = mediaPonderada(grupoB, "taxaCurva") / 100;
  const durationA = mediaPonderada(grupoA, "duration");
  const durationB = mediaPonderada(grupoB, "duration");
  const prazoA = mediaPonderada(grupoA, "prazoMeses");
  const prazoB = mediaPonderada(grupoB, "prazoMeses");

  // Ganho mensal usando taxa na curva (o que efetivamente é pago até o vencimento)
  const ganhoMes = (capitalA * (taxaCurvaB - taxaCurvaA)) / 12;
  const ganhoAno = ganhoMes * 12;
  const mesesBreakeven = ganhoMes > 0 && custo > 0 ? Math.ceil(custo / ganhoMes) : Infinity;

  // Ponto de encontro: onde VF_B(m) = VF_A(m), usando taxa a mercado como cenário base
  // e capital A (o dinheiro que sai). Se capital B ≠ capital A, normalizamos pelo capital investido em B.
  const pontoEncontro = useMemo(() => {
    if (capitalA <= 0 || taxaCurvaA <= 0 || taxaCurvaB <= 0) return null;
    if (taxaCurvaB <= taxaCurvaA) return null;
    // (capitalA - custo) * (1+tB)^t = capitalA * (1+tA)^t
    // (1+tB)^t / (1+tA)^t = capitalA / (capitalA - custo)
    // t = ln(capitalA/(capitalA-custo)) / ln((1+tB)/(1+tA))
    const investido = Math.max(1, capitalA - custo);
    const num = Math.log(capitalA / investido);
    const den = Math.log((1 + taxaCurvaB) / (1 + taxaCurvaA));
    if (den <= 0) return null;
    const anos = num / den;
    return { meses: Math.ceil(anos * 12), anos };
  }, [capitalA, taxaCurvaA, taxaCurvaB, custo]);

  // Gráfico das curvas cruzando
  const horizonte = Math.max(24, Math.min(120, ((pontoEncontro?.meses ?? mesesBreakeven) || 60) * 2));
  const points: { m: number; a: number; b: number }[] = [];
  const capB_efetivo = Math.max(1, capitalA - custo);
  for (let m = 0; m <= horizonte; m += Math.max(1, Math.round(horizonte / 24))) {
    points.push({
      m,
      a: capitalA * Math.pow(1 + taxaCurvaA, m / 12),
      b: capB_efetivo * Math.pow(1 + taxaCurvaB, m / 12),
    });
  }
  const maxV = Math.max(1, ...points.map((p) => Math.max(p.a, p.b)));
  const minV = Math.min(...points.map((p) => Math.min(p.a, p.b)));
  const W = 600, H = 220, PL = 60, PR = 12, PT = 10, PB = 34;
  const xs = (m: number) => PL + (m / horizonte) * (W - PL - PR);
  const ys = (v: number) =>
    maxV === minV ? PT : PT + (1 - (v - minV) / (maxV - minV)) * (H - PT - PB);
  const pathA = points.map((p, i) => (i ? "L" : "M") + xs(p.m) + " " + ys(p.a)).join(" ");
  const pathB = points.map((p, i) => (i ? "L" : "M") + xs(p.m) + " " + ys(p.b)).join(" ");

  const capitalOk =
    capitalA > 0 && capitalB > 0 && Math.abs(capitalA - capitalB) / capitalA < 0.15;

  const setLinhaA = (id: string, patch: Partial<LinhaGrupo>) =>
    setGrupoA((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const setLinhaB = (id: string, patch: Partial<LinhaGrupo>) =>
    setGrupoB((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const podeConfirmar =
    capitalA > 0 &&
    capitalB > 0 &&
    ganhoMes > 0 &&
    grupoA.every((l) => l.capital > 0 && l.taxaCurva > 0) &&
    grupoB.every((l) => l.capital > 0 && l.taxaCurva > 0);

  const jaConfirmado = !!breakevenExistente;

  return (
    <>
      <div className="card" style={{ marginBottom: 14, borderLeft: "4px solid var(--accent)" }}>
        <div className="card-hdr">
          Simulador de trocas & breakeven{" "}
          <span>{jaConfirmado ? "editando breakeven confirmado" : "modo hipotético"}</span>
        </div>
        <div style={{ padding: 16, fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
          Monte a operação em <strong>dois baldes</strong>: o <strong>Grupo A</strong> é de onde
          o dinheiro sai, o <strong>Grupo B</strong> é para onde ele vai. Cada balde pode ter
          quantas linhas você precisar. O sistema calcula o <em>ponto de encontro</em> — o prazo
          em que a nova alocação supera a antiga. Quando você confirmar, isto vira um breakeven
          real e passa a ser vigiado.
        </div>

        <div style={{ padding: "0 16px 16px", display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label className="bk-field">
              Nome deste breakeven
              <input
                type="text"
                value={nome}
                placeholder="ex.: Realoc pós-fixado jun/26"
                onChange={(e) => setNome(e.target.value)}
              />
            </label>
            <label className="bk-field">
              Custo do giro — deságio + IR (R$)
              <input
                type="number"
                min={0}
                value={custo || ""}
                onChange={(e) => setCusto(Number(e.target.value) || 0)}
              />
            </label>
          </div>

          {/* Grupo A */}
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 13, letterSpacing: ".04em", textTransform: "uppercase", color: "#dc2626" }}>
              Grupo A — de onde o dinheiro sai
            </div>
            {grupoA.map((l, idx) => (
              <CartaoLinha
                key={l.id}
                linha={l}
                idx={idx}
                onChange={(p) => setLinhaA(l.id, p)}
                onRemove={() => setGrupoA((prev) => (prev.length === 1 ? prev : prev.filter((x) => x.id !== l.id)))}
                removivel={grupoA.length > 1}
              />
            ))}
            <button
              type="button"
              onClick={() => setGrupoA((prev) => [...prev, novaLinha()])}
              style={btnAdd("#dc2626")}
            >
              + linha no grupo A
            </button>
          </div>

          {/* Grupo B */}
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 13, letterSpacing: ".04em", textTransform: "uppercase", color: "#4f8ef7" }}>
              Grupo B — para onde o dinheiro vai
            </div>
            {grupoB.map((l, idx) => (
              <CartaoLinha
                key={l.id}
                linha={l}
                idx={idx}
                onChange={(p) => setLinhaB(l.id, p)}
                onRemove={() => setGrupoB((prev) => (prev.length === 1 ? prev : prev.filter((x) => x.id !== l.id)))}
                removivel={grupoB.length > 1}
              />
            ))}
            <button
              type="button"
              onClick={() => setGrupoB((prev) => [...prev, novaLinha()])}
              style={btnAdd("#4f8ef7")}
            >
              + linha no grupo B
            </button>
          </div>

          {!capitalOk && capitalA > 0 && capitalB > 0 && (
            <div style={{ fontSize: 12, color: "#b45309", background: "rgba(180,83,9,.08)", padding: 10, borderRadius: 6 }}>
              ⚠ Capital do grupo A ({fmtR(capitalA)}) e B ({fmtR(capitalB)}) divergem em mais de 15%. Verifique se está tudo somando.
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-l">Custo do giro</div>
          <div className="kpi-v bad">{fmtR(custo)}</div>
          <div className="kpi-s">deságio + IR</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Ganho mensal</div>
          <div className="kpi-v good">+{fmtR(ganhoMes)}</div>
          <div className="kpi-s">
            {(taxaCurvaA * 100).toFixed(2)}% → {(taxaCurvaB * 100).toFixed(2)}%
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Breakeven do custo</div>
          <div className="kpi-v blue">
            {isFinite(mesesBreakeven) && mesesBreakeven > 0 ? `${mesesBreakeven} meses` : "—"}
          </div>
          <div className="kpi-s">até o giro se pagar</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Ponto de encontro</div>
          <div className="kpi-v blue">
            {pontoEncontro ? `${pontoEncontro.meses} meses` : "—"}
          </div>
          <div className="kpi-s">B supera A na curva</div>
        </div>
      </div>

      {/* Gráfico + resumo dos grupos */}
      <div className="g32">
        <div className="card">
          <div className="card-hdr">
            Curvas na taxa contratada <span>onde B cruza A é o breakeven</span>
          </div>
          <div className="chart-c" style={{ height: 240 }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }}>
              <ChartAxes minV={minV} maxV={maxV} maxMonth={horizonte} W={W} H={H} PL={PL} PR={PR} PT={PT} PB={PB} xs={xs} ys={ys} />
              <path d={pathA} fill="none" stroke="#dc2626" strokeWidth={2} />
              <path d={pathB} fill="none" stroke="#4f8ef7" strokeWidth={2} />
              {pontoEncontro && pontoEncontro.meses <= horizonte && (() => {
                const vCross = capitalA * Math.pow(1 + taxaCurvaA, pontoEncontro.meses / 12);
                return (
                  <>
                    <line
                      x1={xs(pontoEncontro.meses)} x2={xs(pontoEncontro.meses)}
                      y1={PT} y2={H - PB}
                      stroke="var(--accent)" strokeDasharray="3 3" strokeWidth={1}
                    />
                    <circle cx={xs(pontoEncontro.meses)} cy={ys(vCross)} r={4} fill="var(--accent)" />
                    <text
                      x={xs(pontoEncontro.meses) + 6} y={ys(vCross) - 8}
                      fontSize={11} fill="var(--accent)" fontWeight={600}
                    >
                      m{pontoEncontro.meses} · {fmtRk(vCross)}
                    </text>
                  </>
                );
              })()}
            </svg>
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 10, fontSize: 12, color: "var(--muted)", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 18, height: 2, background: "#dc2626" }} />
              Grupo A ({(taxaCurvaA * 100).toFixed(2)}% · dur {durationA.toFixed(1)}a)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 18, height: 2, background: "#4f8ef7" }} />
              Grupo B ({(taxaCurvaB * 100).toFixed(2)}% · dur {durationB.toFixed(1)}a)
            </span>
          </div>
        </div>

        <div className="card">
          <div className="card-hdr">Resumo dos grupos</div>
          <table className="tbl">
            <tbody>
              <tr>
                <td>Capital A / B</td>
                <td className="r">{fmtR(capitalA)} / {fmtR(capitalB)}</td>
              </tr>
              <tr>
                <td>Taxa a mercado A / B</td>
                <td className="r">
                  {(taxaMercadoA * 100).toFixed(2)}% / {(taxaMercadoB * 100).toFixed(2)}%
                </td>
              </tr>
              <tr>
                <td>Taxa na curva A / B</td>
                <td className="r">
                  {(taxaCurvaA * 100).toFixed(2)}% / {(taxaCurvaB * 100).toFixed(2)}%
                </td>
              </tr>
              <tr>
                <td>Duration média A / B</td>
                <td className="r">{durationA.toFixed(1)}a / {durationB.toFixed(1)}a</td>
              </tr>
              <tr>
                <td>Prazo médio A / B</td>
                <td className="r">
                  {Math.round(prazoA)}m / {Math.round(prazoB)}m
                </td>
              </tr>
              <tr style={{ background: "#f8f9ff" }}>
                <td><strong>Ganho anual pós-breakeven</strong></td>
                <td className="r good"><strong>+{fmtR(ganhoAno)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmação */}
      <div
        className="card"
        style={{
          padding: 18,
          marginTop: 14,
          background: podeConfirmar ? "rgba(34,197,94,.06)" : "rgba(216,179,106,.06)",
          border: `1px solid ${podeConfirmar ? "rgba(34,197,94,.28)" : "rgba(216,179,106,.28)"}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, maxWidth: 520 }}>
          {jaConfirmado ? (
            <>
              Este breakeven já está <strong>confirmado</strong> e sendo vigiado desde{" "}
              {new Date(breakevenExistente!.confirmadoEm).toLocaleDateString("pt-BR")}. Edite as
              linhas acima e reconfirme para atualizar, ou descarte para voltar ao estado em
              branco.
            </>
          ) : podeConfirmar ? (
            <>
              Se você <strong>realizou</strong> essas trocas de verdade, confirme abaixo. Os
              números passam a alimentar o painel consolidado desta carteira.
            </>
          ) : (
            <>
              Preencha capital e taxa na curva em todas as linhas dos dois grupos para poder
              confirmar como breakeven real.
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {jaConfirmado && (
            <button
              type="button"
              onClick={onDescartar}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 12,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid var(--muted)",
                background: "transparent",
                color: "var(--muted)",
                cursor: "pointer",
              }}
            >
              Descartar
            </button>
          )}
          <button
            type="button"
            disabled={!podeConfirmar}
            onClick={() =>
              onConfirmar({
                confirmadoEm: breakevenExistente?.confirmadoEm ?? new Date().toISOString(),
                custo,
                grupoA,
                grupoB,
                nome: nome || "Breakeven sem nome",
              })
            }
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 12,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid var(--accent)",
              background: podeConfirmar ? "var(--accent)" : "transparent",
              color: podeConfirmar ? "#fff" : "var(--muted)",
              cursor: podeConfirmar ? "pointer" : "not-allowed",
              opacity: podeConfirmar ? 1 : 0.55,
            }}
          >
            {jaConfirmado ? "✓ Atualizar breakeven" : "✓ Confirmar — isto é um breakeven real"}
          </button>
        </div>
      </div>
    </>
  );
}

function btnAdd(color: string): React.CSSProperties {
  return {
    fontFamily: "var(--font-display)",
    fontSize: 12,
    letterSpacing: ".06em",
    textTransform: "uppercase",
    padding: "8px 14px",
    borderRadius: 999,
    border: `1px dashed ${color}`,
    background: "transparent",
    color,
    cursor: "pointer",
    justifySelf: "start",
  };
}

// ---- Painel de breakeven confirmado (a partir dos grupos do usuário) -----
function BreakevenConfirmadoUsuario({
  breakeven,
  onEditar,
}: {
  breakeven: BreakevenReal;
  onEditar: () => void;
}) {
  const capitalA = breakeven.grupoA.reduce((s, l) => s + l.capital, 0);
  const capitalB = breakeven.grupoB.reduce((s, l) => s + l.capital, 0);
  const tA = mediaPonderada(breakeven.grupoA, "taxaCurva") / 100;
  const tB = mediaPonderada(breakeven.grupoB, "taxaCurva") / 100;
  const ganhoMes = (capitalA * (tB - tA)) / 12;
  const mesesBreakeven = ganhoMes > 0 && breakeven.custo > 0 ? Math.ceil(breakeven.custo / ganhoMes) : Infinity;

  const inicio = new Date(breakeven.confirmadoEm);
  const progs = [1, 3, 6, 9, 12, 18, Math.max(24, isFinite(mesesBreakeven) ? mesesBreakeven : 24)]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .map((m) => {
      const a = ganhoMes * m;
      const p = Math.min(100, Math.round((a / (breakeven.custo || 1)) * 100));
      const ok = p >= 100;
      const d = new Date(inicio.getFullYear(), inicio.getMonth() + m, 1).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
      return { m, p, ok, d };
    });

  const horizonte = Math.max(24, Math.min(120, (isFinite(mesesBreakeven) ? mesesBreakeven : 60) * 2));
  const capB_ef = Math.max(1, capitalA - breakeven.custo);
  const points: { m: number; a: number; b: number }[] = [];
  for (let m = 0; m <= horizonte; m += Math.max(1, Math.round(horizonte / 24))) {
    points.push({
      m,
      a: capitalA * Math.pow(1 + tA, m / 12),
      b: capB_ef * Math.pow(1 + tB, m / 12),
    });
  }
  const maxV = Math.max(1, ...points.map((p) => Math.max(p.a, p.b)));
  const minV = Math.min(...points.map((p) => Math.min(p.a, p.b)));
  const W = 600, H = 220, PL = 60, PR = 12, PT = 10, PB = 34;
  const xs = (m: number) => PL + (m / horizonte) * (W - PL - PR);
  const ys = (v: number) => maxV === minV ? PT : PT + (1 - (v - minV) / (maxV - minV)) * (H - PT - PB);
  const pathA = points.map((p, i) => (i ? "L" : "M") + xs(p.m) + " " + ys(p.a)).join(" ");
  const pathB = points.map((p, i) => (i ? "L" : "M") + xs(p.m) + " " + ys(p.b)).join(" ");

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          <strong style={{ color: "var(--text)" }}>{breakeven.nome}</strong> · confirmado em{" "}
          {new Date(breakeven.confirmadoEm).toLocaleDateString("pt-BR")}
        </div>
        <button
          type="button"
          onClick={onEditar}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 11,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            padding: "6px 14px",
            borderRadius: 999,
            border: "1px solid var(--accent)",
            background: "transparent",
            color: "var(--accent)",
            cursor: "pointer",
          }}
        >
          Editar / descartar
        </button>
      </div>

      <div className="kpi-row">
        <div className="kpi"><div className="kpi-l">Custo total</div><div className="kpi-v bad">{fmtR(breakeven.custo)}</div><div className="kpi-s">deságio + IR</div></div>
        <div className="kpi"><div className="kpi-l">Ganho mensal</div><div className="kpi-v good">+{fmtR(ganhoMes)}</div><div className="kpi-s">{(tA*100).toFixed(2)}% → {(tB*100).toFixed(2)}%</div></div>
        <div className="kpi"><div className="kpi-l">Breakeven</div><div className="kpi-v blue">{isFinite(mesesBreakeven) ? `${mesesBreakeven} meses` : "—"}</div><div className="kpi-s">até se pagar</div></div>
        <div className="kpi"><div className="kpi-l">Ganho anual pós</div><div className="kpi-v good">+{fmtR(ganhoMes * 12)}</div><div className="kpi-s">recorrente</div></div>
      </div>

      <div className="g32">
        <div className="card">
          <div className="card-hdr">Grupo A vs Grupo B <span>capital giro {fmtR(capitalA)}</span></div>
          <div className="chart-c" style={{ height: 240 }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }}>
              <ChartAxes minV={minV} maxV={maxV} maxMonth={horizonte} W={W} H={H} PL={PL} PR={PR} PT={PT} PB={PB} xs={xs} ys={ys} />
              <path d={pathA} fill="none" stroke="#dc2626" strokeWidth={2} />
              <path d={pathB} fill="none" stroke="#4f8ef7" strokeWidth={2} />
            </svg>
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
                <div className="prog-fill" style={{ width: `${p.p}%`, background: p.ok ? "var(--success)" : "var(--accent)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">Composição por linha</div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Descrição</th>
              <th className="r">Capital</th>
              <th className="r">Curva</th>
              <th className="r">Dur.</th>
              <th className="r">Prazo</th>
            </tr>
          </thead>
          <tbody>
            {breakeven.grupoA.map((l) => (
              <tr key={l.id}>
                <td style={{ color: "#dc2626" }}>A</td>
                <td>{l.desc || "—"}</td>
                <td className="r">{fmtR(l.capital)}</td>
                <td className="r">{l.taxaCurva.toFixed(2)}%</td>
                <td className="r">{l.duration.toFixed(1)}a</td>
                <td className="r">{l.prazoMeses}m</td>
              </tr>
            ))}
            {breakeven.grupoB.map((l) => (
              <tr key={l.id}>
                <td style={{ color: "#4f8ef7" }}>B</td>
                <td>{l.desc || "—"}</td>
                <td className="r">{fmtR(l.capital)}</td>
                <td className="r">{l.taxaCurva.toFixed(2)}%</td>
                <td className="r">{l.duration.toFixed(1)}a</td>
                <td className="r">{l.prazoMeses}m</td>
              </tr>
            ))}
            <tr style={{ background: "#f8f9ff" }}>
              <td colSpan={2}><strong>Totais</strong></td>
              <td className="r"><strong>A {fmtR(capitalA)} · B {fmtR(capitalB)}</strong></td>
              <td className="r">—</td>
              <td className="r">—</td>
              <td className="r">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---- Interação entre breakeven atual (Paulo) e um novo ------------------
function InteracaoBreakevens({
  paulo,
  novo,
}: {
  paulo: typeof PAULO_DATA;
  novo: BreakevenReal;
}) {
  const capNovo = novo.grupoA.reduce((s, l) => s + l.capital, 0);
  const tA_novo = mediaPonderada(novo.grupoA, "taxaCurva");
  const tB_novo = mediaPonderada(novo.grupoB, "taxaCurva");
  const ganhoMesNovo = (capNovo * (tB_novo - tA_novo)) / 12;
  const mesesNovo = ganhoMesNovo > 0 && novo.custo > 0 ? Math.ceil(novo.custo / ganhoMesNovo) : Infinity;

  const custoAtual = paulo.custo;
  const ganhoAtual = paulo.ganho;
  const mesesAtual = Math.ceil(custoAtual / ganhoAtual);

  const custoTotal = custoAtual + novo.custo;
  const ganhoTotal = ganhoAtual + Math.max(0, ganhoMesNovo);
  const mesesCombinado = ganhoTotal > 0 ? Math.ceil(custoTotal / ganhoTotal) : Infinity;
  const encurtou = isFinite(mesesCombinado) ? Math.max(0, mesesAtual - mesesCombinado) : 0;

  return (
    <div className="card" style={{ marginTop: 16, padding: "18px 20px", borderLeft: "4px solid var(--accent)" }}>
      <div className="card-hdr" style={{ marginBottom: 10 }}>
        Interação entre os dois breakevens <span>giro atual + novo giro</span>
      </div>
      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-l">Custo somado</div>
          <div className="kpi-v bad">{fmtR(custoTotal)}</div>
          <div className="kpi-s">{fmtR(custoAtual)} + {fmtR(novo.custo)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Ganho mensal somado</div>
          <div className="kpi-v good">+{fmtR(ganhoTotal)}</div>
          <div className="kpi-s">{fmtR(ganhoAtual)} + {fmtR(Math.max(0, ganhoMesNovo))}</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Breakeven combinado</div>
          <div className="kpi-v blue">
            {isFinite(mesesCombinado) ? `${mesesCombinado} meses` : "—"}
          </div>
          <div className="kpi-s">custo total ÷ ganho total</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Encurta em</div>
          <div className="kpi-v good">{encurtou} meses</div>
          <div className="kpi-s">vs {mesesAtual}m do giro atual</div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, margin: "12px 0 0" }}>
        Somando o giro de jun/2026 ({mesesAtual}m para se pagar) com o novo
        {isFinite(mesesNovo) ? ` (${mesesNovo}m isolado)` : ""}, a carteira zera o custo total em{" "}
        <strong>{isFinite(mesesCombinado) ? `${mesesCombinado} meses` : "prazo indeterminado"}</strong>.
        {encurtou > 0 && (
          <> O novo giro <strong>acelera</strong> o breakeven do atual porque acrescenta ganho recorrente sem esperar o primeiro terminar.</>
        )}
      </p>
    </div>
  );
}

// ---- Página principal ----------------------------------------------------
export function BreakevenPage({ profileId }: { profileId: ProfileId }) {
  const [breakevenUsuario, setBreakevenUsuario] = useState<BreakevenReal | null>(null);
  const [simular, setSimular] = useState(false);

  useEffect(() => {
    setBreakevenUsuario(carregarBreakeven(profileId));
    setSimular(false);
  }, [profileId]);

  // Paulo mantém dados hardcoded pré-carregados (histórico real da carteira)
  if (profileId === "paulo") {
    return (
      <>
        <div className="ph">
          <h1>Plano de breakeven</h1>
          <p>Quando a reestruturação de junho/2026 se paga completamente.</p>
        </div>
        <BreakevenConsolidado data={PAULO_DATA} />

        <div style={{ margin: "26px 0 14px", borderTop: "1px solid var(--border)", paddingTop: 22 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 4 }}>
            Novo breakeven — simulador
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
            Se aparecer outra oportunidade de giro, monte aqui. Ao confirmar, você vê
            como o novo breakeven interage com o de jun/2026 (ganho combinado, prazo total, meses encurtados).
          </p>

          {breakevenUsuario && !simular && (
            <>
              <BreakevenConfirmadoUsuario
                breakeven={breakevenUsuario}
                onEditar={() => setSimular(true)}
              />
              <InteracaoBreakevens paulo={PAULO_DATA} novo={breakevenUsuario} />
            </>
          )}

          {simular && (
            <>
              <div style={{ marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => setSimular(false)}
                  style={{
                    fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: ".08em",
                    textTransform: "uppercase", padding: "6px 14px", borderRadius: 999,
                    border: "1px solid var(--muted)", background: "transparent",
                    color: "var(--muted)", cursor: "pointer",
                  }}
                >
                  ← voltar
                </button>
              </div>
              <SimuladorTrocaBreakeven
                profileId={profileId}
                breakevenExistente={breakevenUsuario}
                onConfirmar={(be) => {
                  salvarBreakeven(profileId, be);
                  setBreakevenUsuario(be);
                  setSimular(false);
                }}
                onDescartar={() => {
                  salvarBreakeven(profileId, null);
                  setBreakevenUsuario(null);
                  setSimular(false);
                }}
              />
            </>
          )}

          {!breakevenUsuario && !simular && (
            <div
              className="card"
              style={{
                padding: "22px 20px", textAlign: "center",
                borderLeft: "4px solid var(--accent)",
              }}
            >
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: 480, margin: "0 auto 14px" }}>
                Nenhum novo giro simulado. Abra o simulador para montar em dois baldes
                (de onde sai / para onde vai) e, se confirmar, ele passa a ser vigiado ao lado do atual.
              </p>
              <button
                type="button"
                onClick={() => setSimular(true)}
                style={{
                  fontFamily: "var(--font-display)", fontSize: 12, letterSpacing: ".08em",
                  textTransform: "uppercase", padding: "10px 20px", borderRadius: 999,
                  border: "1px solid var(--accent)", background: "var(--accent)",
                  color: "#fff", cursor: "pointer",
                }}
              >
                Simular novo breakeven
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  // Se este perfil já confirmou um breakeven, mostra o painel dele
  if (breakevenUsuario && !simular) {
    return (
      <>
        <div className="ph">
          <h1>Plano de breakeven</h1>
          <p>Trocas confirmadas — vigiadas até o giro se pagar.</p>
        </div>
        <BreakevenConfirmadoUsuario
          breakeven={breakevenUsuario}
          onEditar={() => setSimular(true)}
        />
      </>
    );
  }

  // Estado inicial: em branco, com CTA para o simulador
  if (!simular) {
    return (
      <>
        <div className="ph">
          <h1>Plano de breakeven</h1>
          <p>Nenhum giro foi carimbado ainda como breakeven real nesta carteira.</p>
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
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, maxWidth: 480, margin: "0 auto 16px" }}>
            Use o simulador para montar a troca em dois baldes (de onde sai / para onde vai),
            com taxa a mercado, taxa na curva, duration e prazo. Se você <strong>de fato
            realizar</strong> as trocas, confirme — a partir daí este painel passa a exibir o
            breakeven real e o acompanha até se pagar.
          </p>
          <button
            type="button"
            onClick={() => setSimular(true)}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 12,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              padding: "10px 20px",
              borderRadius: 999,
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Abrir simulador de trocas & breakeven
          </button>
        </div>
      </>
    );
  }

  // Modo simulador
  return (
    <>
      <div className="ph">
        <h1>{breakevenUsuario ? "Editar breakeven" : "Simulador de trocas & breakeven"}</h1>
        <p>
          {breakevenUsuario
            ? "Ajuste as linhas e reconfirme, ou descarte para começar do zero."
            : "Monte a troca em dois baldes. Nada afeta a carteira até você confirmar."}
        </p>
        <button
          type="button"
          onClick={() => setSimular(false)}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 11,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            padding: "6px 14px",
            borderRadius: 999,
            border: "1px solid var(--muted)",
            background: "transparent",
            color: "var(--muted)",
            cursor: "pointer",
            marginTop: 8,
          }}
        >
          ← voltar
        </button>
      </div>
      <SimuladorTrocaBreakeven
        profileId={profileId}
        breakevenExistente={breakevenUsuario}
        onConfirmar={(be) => {
          salvarBreakeven(profileId, be);
          setBreakevenUsuario(be);
          setSimular(false);
        }}
        onDescartar={() => {
          salvarBreakeven(profileId, null);
          setBreakevenUsuario(null);
          setSimular(false);
        }}
      />
    </>
  );
}

export const __fmtR = fmtR;
