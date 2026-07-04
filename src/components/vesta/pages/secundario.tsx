import { useMemo, useState } from "react";

function fmtR(n: number) {
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}

// LCD BRDE FEV/2036 — parâmetros
const VALOR_HOJE = 106961; // 2 lotes somados
const TAXA_LCD = 0.925; // 92,5% CDI
const VENCIMENTO_ANOS = 9.6; // ~fev/2036 desde jul/2026

export function SecundarioPage() {
  const [cdiHoje] = useState(14.75);
  const [cdiFuturo, setCdiFuturo] = useState(9.0); // CDI médio esperado até 2036
  const [desagio, setDesagio] = useState(4); // % de deságio no secundário
  const [taxaReinv, setTaxaReinv] = useState(7.5); // IPCA+X% cupom real
  const [ipca, setIpca] = useState(4.0);

  const sim = useMemo(() => {
    // Cenário HOLD (segurar até 2036)
    const cdiEfetivo = cdiFuturo; // média ponderada esperada
    const taxaHold = (cdiEfetivo * TAXA_LCD) / 100;
    const valorHold2036 = VALOR_HOJE * Math.pow(1 + taxaHold, VENCIMENTO_ANOS);

    // Cenário SELL (vender agora com deságio + reinvestir NTN-B IPCA+X%)
    const valorVenda = VALOR_HOJE * (1 - desagio / 100);
    const taxaReinvTotal = taxaReinv + ipca;
    const valorSell2036 = valorVenda * Math.pow(1 + taxaReinvTotal / 100, VENCIMENTO_ANOS);

    const diff = valorSell2036 - valorHold2036;
    const diffPct = (diff / valorHold2036) * 100;
    const breakEvenDesagio = (1 - Math.pow(1 + taxaHold, VENCIMENTO_ANOS) / Math.pow(1 + taxaReinvTotal / 100, VENCIMENTO_ANOS)) * 100;

    return { valorHold2036, valorSell2036, valorVenda, diff, diffPct, taxaHold: taxaHold * 100, taxaReinvTotal, breakEvenDesagio };
  }, [cdiFuturo, desagio, taxaReinv, ipca]);

  const vantagemSell = sim.diff > 0;

  return (
    <>
      <div className="ph">
        <h1>Saída no secundário · LCD BRDE FEV/2036</h1>
        <p>
          Simulação de venda antecipada dos R$106.961 travados a 92,5% CDI até 2036 vs. segurar até o
          vencimento. A dor de vender com deságio pode compensar se a Selic realmente cair.
        </p>
      </div>

      <div style={{
        background: "var(--warning-bg)", border: "1px solid var(--warning)",
        borderRadius: "var(--radius)", padding: "12px 16px", marginBottom: 14, fontSize: 13,
      }}>
        <strong style={{ color: "var(--warning)" }}>⚠️ Contexto</strong> — 2 lotes do LCD BRDE (55 + 47
        títulos) totalizam R$106.961 a 92,5% CDI. Se a Selic ficar em 9% por 10 anos, esse LCD rende
        ~8,3% a.a. — enquanto uma NTN-B nova hoje trava IPCA+7,5% (~11,5% nominal). Diferença de ~3
        pontos por 10 anos é dinheiro real.
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-l">Valor hoje</div>
          <div className="kpi-v blue">{fmtR(VALOR_HOJE)}</div>
          <div className="kpi-s">2 lotes · 92,5% CDI</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Segurar até 2036</div>
          <div className="kpi-v">{fmtR(sim.valorHold2036)}</div>
          <div className="kpi-s">{sim.taxaHold.toFixed(2)}% a.a. média</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Vender + reinvestir</div>
          <div className={"kpi-v " + (vantagemSell ? "good" : "bad")}>{fmtR(sim.valorSell2036)}</div>
          <div className="kpi-s">{sim.taxaReinvTotal.toFixed(2)}% a.a. no reinvestimento</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Diferença</div>
          <div className={"kpi-v " + (vantagemSell ? "good" : "bad")}>
            {vantagemSell ? "+" : ""}{fmtR(sim.diff)}
          </div>
          <div className="kpi-s">{sim.diffPct.toFixed(1)}% sobre hold</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">Premissas ajustáveis</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, fontSize: 13 }}>
          <div>
            <label style={{ display: "block", marginBottom: 4 }}>
              <strong>CDI médio esperado 2026→2036:</strong> {cdiFuturo.toFixed(1)}%
            </label>
            <input type="range" min={6} max={14} step={0.5} value={cdiFuturo}
              onChange={(e) => setCdiFuturo(Number(e.target.value))} style={{ width: "100%" }} />
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              Hoje {cdiHoje}%. Mercado precifica ~8-9% em 2028 e ~7-8% de 2030 em diante.
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4 }}>
              <strong>Deságio na venda:</strong> {desagio}%
            </label>
            <input type="range" min={0} max={12} step={0.5} value={desagio}
              onChange={(e) => setDesagio(Number(e.target.value))} style={{ width: "100%" }} />
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              LCD de banco de fomento típico: 2-6%. Quanto mais longo, mais alto.
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4 }}>
              <strong>Cupom NTN-B / DEB reinvestimento:</strong> IPCA + {taxaReinv.toFixed(1)}%
            </label>
            <input type="range" min={5} max={10} step={0.25} value={taxaReinv}
              onChange={(e) => setTaxaReinv(Number(e.target.value))} style={{ width: "100%" }} />
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              NTN-B 2035 hoje: IPCA+7,3%. DEB isenta: IPCA+8% comum.
            </div>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4 }}>
              <strong>IPCA médio esperado:</strong> {ipca.toFixed(1)}%
            </label>
            <input type="range" min={3} max={7} step={0.25} value={ipca}
              onChange={(e) => setIpca(Number(e.target.value))} style={{ width: "100%" }} />
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              Meta BCB 3% ± 1,5%. Média histórica ~5%.
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">Comparação lado a lado</div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Cenário</th>
              <th className="r">Valor recebido hoje</th>
              <th className="r">Taxa efetiva a.a.</th>
              <th className="r">Valor em 2036</th>
              <th>Risco</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>🔒 Segurar (hold)</strong></td>
              <td className="r">—</td>
              <td className="r">{sim.taxaHold.toFixed(2)}%</td>
              <td className="r"><strong>{fmtR(sim.valorHold2036)}</strong></td>
              <td><span style={{ fontSize: 12, color: "var(--muted)" }}>Emissor BRDE (baixo) · reinvestimento (alto)</span></td>
            </tr>
            <tr style={vantagemSell ? { background: "rgba(74,124,89,.06)" } : { background: "rgba(220,38,38,.04)" }}>
              <td><strong>💸 Vender + NTN-B/DEB</strong></td>
              <td className="r">{fmtR(sim.valorVenda)}</td>
              <td className="r">{sim.taxaReinvTotal.toFixed(2)}%</td>
              <td className="r"><strong>{fmtR(sim.valorSell2036)}</strong></td>
              <td><span style={{ fontSize: 12, color: "var(--muted)" }}>Deságio confirmado · trava taxa real</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-hdr">Ponto de indiferença</div>
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          <p>
            Com CDI médio {cdiFuturo.toFixed(1)}% e reinvestimento a {sim.taxaReinvTotal.toFixed(2)}%,
            <strong> vender só compensa até um deságio de aproximadamente {sim.breakEvenDesagio.toFixed(1)}%</strong>.
            Acima disso, hold ganha.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>Resultado atual:</strong>{" "}
            {vantagemSell ? (
              <span style={{ color: "var(--success)" }}>
                Vender e reinvestir gera <strong>{fmtR(sim.diff)}</strong> a mais em 10 anos ({sim.diffPct.toFixed(1)}%).
              </span>
            ) : (
              <span style={{ color: "var(--danger)" }}>
                Segurar gera <strong>{fmtR(-sim.diff)}</strong> a mais em 10 anos. Deságio inviabiliza a troca.
              </span>
            )}
          </p>
          <p style={{ marginTop: 8, color: "var(--muted)", fontSize: 12 }}>
            Janela ideal: mercado <em>já precificou</em> corte de Selic mas ainda não cortou. Aí
            deságio no LCD tende a ser menor (comprador quer travar pós-fix antes da queda) e taxa
            IPCA+ ainda está atrativa. Depois do corte, deságio cresce e IPCA+ cai — janela fecha.
          </p>
        </div>
      </div>
    </>
  );
}
