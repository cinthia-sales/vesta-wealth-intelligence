import { useState } from "react";

function colorFor(pct: number) {
  return pct >= 1.1 ? "var(--success)" : pct >= 0.92 ? "var(--warning)" : "var(--danger)";
}

const IPCA_MARKS: Record<number, string> = {
  5.86: "← Lit. Sul",
  6.45: "← Itapoá",
  8.5: "← Jalles",
  9.45: "← NTN-B Paulo",
};

const IPCA_SPREADS = [4, 5, 5.86, 6, 6.45, 7, 8, 8.5, 9, 9.45, 10];
const PRE_RATES = [12, 13, 14, 14.5, 15, 15.15, 16];

export function EquivPage() {
  const [cdi, setCdi] = useState(14.75);
  const [ipca, setIpca] = useState(5.5);
  const [ir, setIr] = useState(0.15);

  const cdiF = cdi / 100;
  const ipcaF = ipca / 100;

  const ativos = [
    { n: "LCAs 92% CDI isentas", t: cdiF * 0.92, iso: true },
    { n: "LCA ORIGINAL 94% CDI", t: cdiF * 0.94, iso: true },
    { n: "DEB J&F 15,15% isento", t: 0.1515, iso: true },
    { n: "DEB Jalles IPCA+8,5%", t: (1 + ipcaF) * (1 + 0.085) - 1, iso: true },
    { n: "NTN-B 2026 IPCA+9,45%", t: (1 + ipcaF) * (1 + 0.0945) - 1, iso: false },
    { n: "NTN-B 2050 IPCA+4,45%", t: (1 + ipcaF) * (1 + 0.0445) - 1, iso: false },
    { n: "NTN-B 2050 IPCA+4,65%", t: (1 + ipcaF) * (1 + 0.0465) - 1, iso: false },
  ];

  return (
    <>
      <div className="ph">
        <h1>Equivalência de taxas</h1>
        <p>Compare qualquer ativo em bases iguais. Tudo convertido para % CDI equivalente.</p>
      </div>

      <div className="eq-grid">
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-hdr">Parâmetros do mercado</div>
            <div className="sl-row">
              <div className="sl-lbl">
                <span>CDI anual</span>
                <strong>{cdi.toFixed(2)}%</strong>
              </div>
              <input
                type="range"
                min={8}
                max={18}
                step={0.25}
                value={cdi}
                onChange={(e) => setCdi(+e.target.value)}
              />
            </div>
            <div className="sl-row">
              <div className="sl-lbl">
                <span>IPCA projetado</span>
                <strong>{ipca.toFixed(2)}%</strong>
              </div>
              <input
                type="range"
                min={3}
                max={9}
                step={0.25}
                value={ipca}
                onChange={(e) => setIpca(+e.target.value)}
              />
            </div>
            <div className="fld">
              <label>IR alíquota</label>
              <select className="ir-sel" value={ir} onChange={(e) => setIr(+e.target.value)}>
                <option value={0.225}>22,5% (até 180 dias)</option>
                <option value={0.2}>20% (181–360 dias)</option>
                <option value={0.175}>17,5% (361–720 dias)</option>
                <option value={0.15}>15% (acima de 720 dias)</option>
              </select>
            </div>
          </div>

          <div className="card">
            <div className="card-hdr">Seus ativos — taxa líquida e % CDI</div>
            {ativos.map((a) => {
              const liq = a.iso ? a.t : a.t * (1 - ir);
              const pct = a.iso ? a.t / (1 - ir) / cdiF : a.t / cdiF;
              const col = colorFor(pct);
              return (
                <div className="eq-ref" key={a.n}>
                  <span className={"sb " + (a.iso ? "sb-g" : "sb-w")} style={{ fontSize: 10 }}>
                    {a.iso ? "isento" : "IR"}
                  </span>
                  <span style={{ flex: 1, padding: "0 8px" }}>{a.n}</span>
                  <div>
                    <div className="eq-val" style={{ color: col }}>
                      {(liq * 100).toFixed(2)}% líq = {(pct * 100).toFixed(1)}% CDI
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-hdr">IPCA+ isento → % CDI tributado</div>
            {IPCA_SPREADS.map((s) => {
              const bruto = (1 + ipcaF) * (1 + s / 100) - 1;
              const pct = bruto / (1 - ir) / cdiF;
              const col = colorFor(pct);
              return (
                <div className="eq-ref" key={s}>
                  <span>
                    IPCA+{s}%
                    {IPCA_MARKS[s] && (
                      <span style={{ fontSize: 10, color: "var(--muted)" }}> {IPCA_MARKS[s]}</span>
                    )}
                  </span>
                  <div>
                    <div className="eq-val" style={{ color: col }}>{(pct * 100).toFixed(1)}% CDI</div>
                    <div className="eq-mark">{(bruto * 100).toFixed(2)}% bruto</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="card">
            <div className="card-hdr">Prefixado isento → % CDI tributado</div>
            {PRE_RATES.map((t) => {
              const pct = t / 100 / (1 - ir) / cdiF;
              const col = colorFor(pct);
              return (
                <div className="eq-ref" key={t}>
                  <span>
                    {t}% prefixado isento
                    {t === 15.15 && (
                      <span style={{ fontSize: 10, color: "var(--muted)" }}> ← J&F</span>
                    )}
                  </span>
                  <div className="eq-val" style={{ color: col }}>{(pct * 100).toFixed(1)}% CDI</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
