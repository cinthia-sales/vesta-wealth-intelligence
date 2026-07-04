import { useState } from "react";

function fmtR(n: number) {
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}

type Side = {
  n: string;
  v: number;
  c: number;
  t: number;
  iso: boolean;
  ir: number;
  div: number;
  apre: number;
};

const DEFAULT_A: Side = { n: "Fundo DI XP", v: 100000, c: 0, t: 14.75, iso: false, ir: 0.15, div: 0, apre: 0 };
const DEFAULT_B: Omit<Side, "v" | "div" | "apre"> = { n: "LCA 92% CDI", c: 0, t: 13.57, iso: true, ir: 0.15 };

type Preset = {
  an: string; av: number; ac: number; at: number; ai: boolean; air: number; adiv: number; aap: number;
  bn: string; bt: number; bi: boolean; bir: number;
};

const PRESETS: Record<string, Preset> = {
  fundo:   { an:"Fundo DI (100% CDI tributado)", av:105654, ac:608,  at:14.75, ai:false, air:0.15, adiv:0,    aap:0,  bn:"LCA 92% CDI isenta",    bt:13.57, bi:true, bir:0.15 },
  western: { an:"Western Asset Total Credit",    av:402651, ac:4698, at:14.75, ai:false, air:0.15, adiv:0,    aap:0,  bn:"LCA 92% CDI isenta",    bt:13.57, bi:true, bir:0.15 },
  ntb50:   { an:"NTN-B 2050 IPCA+4,45%",         av:35524,  ac:0,    at:10.19, ai:false, air:0.15, adiv:0,    aap:0,  bn:"Deb IPCA+8,5% isenta",  bt:14.47, bi:true, bir:0.15 },
  deb:     { an:"Deb Litoral Sul IPCA+5,86%",    av:18428,  ac:2311, at:11.68, ai:true,  air:0.15, adiv:0,    aap:0,  bn:"DEB Jalles IPCA+8,5%",  bt:14.47, bi:true, bir:0.15 },
  fii:     { an:"TGRE11 FII",                    av:44155,  ac:0,    at:0,     ai:true,  air:0.15, adiv:4800, aap:-2, bn:"LCA 92% CDI isenta",    bt:13.57, bi:true, bir:0.15 },
};

const getLiq = (taxa: number, iso: boolean, ir: number) => (iso ? taxa / 100 : (taxa / 100) * (1 - ir));

export function ValidadorPage() {
  const [a, setA] = useState<Side>(DEFAULT_A);
  const [b, setB] = useState<Omit<Side, "v" | "div" | "apre">>(DEFAULT_B);

  const bv = a.v - a.c;
  const arl = getLiq(a.t, a.iso, a.ir);
  const adl = a.v ? a.div / a.v : 0;
  const aapl = a.apre / 100;
  const atl = arl + adl + aapl;
  const brl = getLiq(b.t, b.iso, b.ir);

  const per = [
    { l: "6 meses", t: 0.5 }, { l: "1 ano", t: 1 }, { l: "2 anos", t: 2 },
    { l: "3 anos", t: 3 }, { l: "5 anos", t: 5 }, { l: "10 anos", t: 10 },
  ];
  const rows = per.map(({ l, t }) => {
    const aT = a.v * Math.pow(1 + aapl, t) + a.v * (Math.pow(1 + arl, t) - 1) + a.div * t;
    const bT = bv * Math.pow(1 + brl, t);
    return { l, aT, bT, win: bT > aT };
  });

  const a1 = a.v * (1 + atl);
  const b1 = bv * (1 + brl);
  const bw1 = b1 > a1;
  const bw5 = bv * Math.pow(1 + brl, 5) > a.v * Math.pow(1 + atl, 5);

  const loadPreset = (id: string) => {
    const p = PRESETS[id]; if (!p) return;
    setA({ n: p.an, v: p.av, c: p.ac, t: p.at, iso: p.ai, ir: p.air, div: p.adiv, apre: p.aap });
    setB({ n: p.bn, c: 0, t: p.bt, iso: p.bi, ir: p.bir });
  };

  return (
    <>
      <div className="ph">
        <h1>Validador de troca</h1>
        <p>Vale a pena trocar ativo A por B? Calcule o breakeven de qualquer substituição.</p>
      </div>

      <div className="preset-row">
        <button className="pbtn" onClick={() => loadPreset("fundo")}>Fundo DI → LCA</button>
        <button className="pbtn" onClick={() => loadPreset("western")}>Western Asset → LCA</button>
        <button className="pbtn" onClick={() => loadPreset("ntb50")}>NTN-B 2050 → Deb nova</button>
        <button className="pbtn" onClick={() => loadPreset("deb")}>Deb antiga → Jalles</button>
        <button className="pbtn" onClick={() => loadPreset("fii")}>TGRE11 → LCA</button>
      </div>

      <div className="val-grid">
        {/* Ativo A */}
        <div className="side-card a">
          <div className="side-title a">Ativo atual — A</div>
          <div className="fld"><label>Nome</label>
            <input type="text" value={a.n} onChange={(e) => setA({ ...a, n: e.target.value })} />
          </div>
          <div className="fld-row">
            <div className="fld"><label>Valor mercado (R$)</label>
              <input type="number" value={a.v} onChange={(e) => setA({ ...a, v: +e.target.value || 0 })} />
            </div>
            <div className="fld"><label>Custo de saída (R$)</label>
              <input type="number" value={a.c} onChange={(e) => setA({ ...a, c: +e.target.value || 0 })} />
            </div>
          </div>
          <div className="fld-row">
            <div className="fld"><label>Taxa bruta (%/ano)</label>
              <input type="number" step={0.1} value={a.t} onChange={(e) => setA({ ...a, t: +e.target.value || 0 })} />
            </div>
            <label
              className={"iso-toggle" + (a.iso ? " on" : "")}
              onClick={() => setA({ ...a, iso: !a.iso })}
            >
              <span>{a.iso ? "isento" : "tributado"}</span>
            </label>
          </div>
          <div className="fld"><label>IR (%)</label>
            <select className="ir-sel" value={a.ir} onChange={(e) => setA({ ...a, ir: +e.target.value })}>
              <option value={0.225}>22,5%</option>
              <option value={0.2}>20%</option>
              <option value={0.175}>17,5%</option>
              <option value={0.15}>15%</option>
            </select>
          </div>
          <div className="fld"><label>Dividendo / rendimento anual (R$)</label>
            <input type="number" value={a.div} onChange={(e) => setA({ ...a, div: +e.target.value || 0 })} />
          </div>
          <div className="fld"><label>Variação esperada (%/ano — ações/FII)</label>
            <input type="number" step={0.1} value={a.apre} onChange={(e) => setA({ ...a, apre: +e.target.value || 0 })} />
          </div>
          <div className="tip-txt">
            Taxa líquida: {(arl * 100).toFixed(2)}% rend.
            {a.div ? ` + ${(adl * 100).toFixed(1)}% div.` : ""}
            {a.apre ? ` + ${a.apre.toFixed(1)}% apre.` : ""} = {(atl * 100).toFixed(2)}% total/ano
          </div>
        </div>

        {/* Ativo B */}
        <div className="side-card b">
          <div className="side-title b">Alternativa — B</div>
          <div className="fld"><label>Nome</label>
            <input type="text" value={b.n} onChange={(e) => setB({ ...b, n: e.target.value })} />
          </div>
          <div className="fld"><label>Capital disponível (mercado A − custo)</label>
            <input type="number" value={bv} readOnly />
          </div>
          <div className="fld-row">
            <div className="fld"><label>Taxa bruta (%/ano)</label>
              <input type="number" step={0.1} value={b.t} onChange={(e) => setB({ ...b, t: +e.target.value || 0 })} />
            </div>
            <label
              className={"iso-toggle" + (b.iso ? " on" : "")}
              onClick={() => setB({ ...b, iso: !b.iso })}
            >
              <span>{b.iso ? "isento" : "tributado"}</span>
            </label>
          </div>
          <div className="fld"><label>IR (%)</label>
            <select className="ir-sel" value={b.ir} onChange={(e) => setB({ ...b, ir: +e.target.value })}>
              <option value={0.225}>22,5%</option>
              <option value={0.2}>20%</option>
              <option value={0.175}>17,5%</option>
              <option value={0.15}>15%</option>
            </select>
          </div>
          <div className="tip-txt">
            Taxa líquida: {(brl * 100).toFixed(2)}%/ano sobre {fmtR(bv)}
          </div>
        </div>
      </div>

      {/* Veredito */}
      {(() => {
        if (bw1 && bw5) {
          return (
            <div className="verdict v-green">
              <div className="verdict-title" style={{ color: "var(--success)" }}>
                Vale a pena trocar para {b.n}
              </div>
              <div className="verdict-sub" style={{ color: "var(--success)" }}>
                B ganha já no 1º ano. A: {(atl * 100).toFixed(2)}% vs B: {(brl * 100).toFixed(2)}%/ano
              </div>
            </div>
          );
        }
        if (!bw1 && !bw5) {
          return (
            <div className="verdict v-red">
              <div className="verdict-title" style={{ color: "var(--danger)" }}>Não vale a pena trocar agora</div>
              <div className="verdict-sub" style={{ color: "var(--danger)" }}>
                A: {(atl * 100).toFixed(2)}% vs B: {(brl * 100).toFixed(2)}%/ano
              </div>
            </div>
          );
        }
        return (
          <div className="verdict v-warn">
            <div className="verdict-title" style={{ color: "var(--warning)" }}>Depende do prazo</div>
            <div className="verdict-sub" style={{ color: "var(--warning)" }}>
              B supera A em alguns anos. Avalie o custo e o horizonte.
            </div>
          </div>
        );
      })()}

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-hdr">Comparação ao longo do tempo</div>
        <div style={{ overflowX: "auto" }}>
          <table className="cmp-tbl">
            <thead>
              <tr>
                <th>Período</th>
                <th>{a.n}</th>
                <th>{b.n}</th>
                <th>Vantagem B</th>
                <th>Decisão</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.l} className={r.win ? "win" : ""}>
                  <td>{r.l}</td>
                  <td>{fmtR(r.aT)}</td>
                  <td style={{ color: r.win ? "var(--success)" : "inherit" }}>{fmtR(r.bT)}</td>
                  <td style={{ color: r.win ? "var(--success)" : "var(--danger)" }}>
                    {r.bT >= r.aT ? "+" : "-"}
                    {fmtR(Math.abs(r.bT - r.aT))}
                  </td>
                  <td>
                    <span className={"sb " + (r.win ? "sb-g" : "sb-r")}>{r.win ? "B ganha" : "A ganha"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
