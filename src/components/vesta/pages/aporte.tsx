import { useMemo, useState } from "react";

const CUSTO = 14698;
const GANHO_BASE = 692;
const MESES_BASE = 22; // mai/2028

function fmtR(n: number) {
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}

export function AportePage() {
  const [aporte, setAporte] = useState(0);
  const [taxaExtra, setTaxaExtra] = useState(13.5); // % a.a. do aporte novo

  const sim = useMemo(() => {
    const ganhoExtraMes = (aporte * taxaExtra) / 100 / 12;
    const ganhoTotalMes = GANHO_BASE + ganhoExtraMes;
    const mesesNovos = ganhoTotalMes > 0 ? CUSTO / ganhoTotalMes : Infinity;
    const mesesGanhos = Math.max(0, MESES_BASE - mesesNovos);
    // Data breakeven a partir de jul/2026
    const inicio = new Date(2026, 6, 1);
    const dataNova = new Date(inicio.getFullYear(), inicio.getMonth() + Math.ceil(mesesNovos), 1);
    return {
      ganhoExtraMes,
      ganhoTotalMes,
      mesesNovos,
      mesesGanhos,
      dataNova,
    };
  }, [aporte, taxaExtra]);

  const dataStr = sim.dataNova.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const targets = [
    { m: 500, label: "R$ 500/mês" },
    { m: 1000, label: "R$ 1.000/mês" },
    { m: 2000, label: "R$ 2.000/mês" },
    { m: 3000, label: "R$ 3.000/mês" },
    { m: 5000, label: "R$ 5.000/mês" },
  ].map((t) => {
    const g = GANHO_BASE + (t.m * taxaExtra) / 100 / 12;
    const meses = CUSTO / g;
    return { ...t, meses, ganho: g };
  });

  return (
    <>
      <div className="ph">
        <h1>Acelerar breakeven</h1>
        <p>
          Quanto o aporte mensal adicional adianta o pagamento do custo de reestruturação
          (R$ 14.698). Ganho base atual: +R$ 692/mês → breakeven em mai/2028 (22 meses).
        </p>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-l">Aporte simulado</div>
          <div className="kpi-v blue">{fmtR(aporte)}/mês</div>
          <div className="kpi-s">a {taxaExtra.toFixed(1)}% a.a.</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Novo ganho mensal</div>
          <div className="kpi-v good">+R$ {Math.round(sim.ganhoTotalMes).toLocaleString("pt-BR")}/mês</div>
          <div className="kpi-s">
            base R$ 692 + extra {fmtR(sim.ganhoExtraMes)}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Novo breakeven</div>
          <div className="kpi-v good">{dataStr}</div>
          <div className="kpi-s">{sim.mesesNovos.toFixed(1)} meses</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Meses economizados</div>
          <div className="kpi-v good">{sim.mesesGanhos.toFixed(1)}</div>
          <div className="kpi-s">vs. mai/2028 base</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">Simulador</div>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>
              <strong>Aporte mensal adicional:</strong> {fmtR(aporte)}
            </label>
            <input
              type="range" min={0} max={10000} step={100} value={aporte}
              onChange={(e) => setAporte(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ fontSize: 11, color: "var(--muted)" }}>0 a R$ 10.000/mês</div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontSize: 13 }}>
              <strong>Taxa média do aporte novo:</strong> {taxaExtra.toFixed(1)}% a.a.
            </label>
            <input
              type="range" min={8} max={17} step={0.25} value={taxaExtra}
              onChange={(e) => setTaxaExtra(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              Referência: LCA nova ~13,6% · DEB isenta ~15% · NTN-B nova ~11,3% líq.
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">Referência rápida <span>a {taxaExtra.toFixed(1)}% a.a.</span></div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Aporte</th>
              <th className="r">Ganho total/mês</th>
              <th className="r">Meses até breakeven</th>
              <th>Data estimada</th>
              <th className="r">Economia vs. base</th>
            </tr>
          </thead>
          <tbody>
            {targets.map((t) => {
              const data = new Date(2026, 6 + Math.ceil(t.meses), 1)
                .toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
              return (
                <tr key={t.m}>
                  <td><strong>{t.label}</strong></td>
                  <td className="r">R$ {Math.round(t.ganho).toLocaleString("pt-BR")}</td>
                  <td className="r">{t.meses.toFixed(1)}</td>
                  <td>{data}</td>
                  <td className="r good">{(MESES_BASE - t.meses).toFixed(1)} meses</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
