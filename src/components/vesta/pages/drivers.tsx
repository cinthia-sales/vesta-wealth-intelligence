import { useMemo, useState } from "react";

type Driver = {
  nome: string;
  descricao: string;
  hoje: number;
  min: number;
  max: number;
  step: number;
  unidade: string;
  impacto: (v: number, base: number) => number; // R$ / ano estimado
};

const DRIVERS: Driver[] = [
  {
    nome: "Selic (CDI)",
    descricao: "Base de todo pós-fixado. Selic caindo derruba LCA, LCD, LFT.",
    hoje: 14.75, min: 7, max: 16, step: 0.25, unidade: "%",
    impacto: (v, base) => (v - 14.75) * base * 0.007, // ~pós-fix ~48% da carteira média
  },
  {
    nome: "IPCA (inflação)",
    descricao: "Combustível das NTN-B, DEB Jalles e ativos indexados a preços.",
    hoje: 5.5, min: 2, max: 10, step: 0.25, unidade: "%",
    impacto: (v, base) => (v - 5.5) * base * 0.003,
  },
  {
    nome: "Spread crédito privado",
    descricao: "Prêmio pago acima da NTN-B — determina se DEB nova vale a pena.",
    hoje: 2.5, min: 0.5, max: 6, step: 0.25, unidade: "% (spread)",
    impacto: (v, base) => (v - 2.5) * base * 0.0015,
  },
  {
    nome: "Câmbio USD/BRL",
    descricao: "Afeta IVVB, GOLD, NASD e importa via inflação. Alto → mais inflação.",
    hoje: 5.6, min: 4, max: 8, step: 0.1, unidade: "BRL",
    impacto: (v, base) => (v - 5.6) * base * 0.004,
  },
  {
    nome: "Rating soberano BR",
    descricao: "Melhora → cai prêmio de risco, subida de preço de NTN-B longas.",
    hoje: 0, min: -3, max: 3, step: 1, unidade: "notch",
    impacto: (v, base) => v * base * 0.008,
  },
];

type Ativo = { nome: string; sensibilidade: Record<string, "alta" | "media" | "baixa" | "inversa">; };
const MATRIZ: Ativo[] = [
  {
    nome: "LCA / LCD / LFT (pós-fixado)",
    sensibilidade: { "Selic (CDI)": "alta", "IPCA (inflação)": "baixa", "Spread crédito privado": "baixa", "Câmbio USD/BRL": "baixa", "Rating soberano BR": "baixa" },
  },
  {
    nome: "NTN-B (IPCA + cupom)",
    sensibilidade: { "Selic (CDI)": "media", "IPCA (inflação)": "alta", "Spread crédito privado": "baixa", "Câmbio USD/BRL": "media", "Rating soberano BR": "alta" },
  },
  {
    nome: "DEB J&F / Jalles (privado)",
    sensibilidade: { "Selic (CDI)": "media", "IPCA (inflação)": "media", "Spread crédito privado": "alta", "Câmbio USD/BRL": "baixa", "Rating soberano BR": "media" },
  },
  {
    nome: "Ações Brasil",
    sensibilidade: { "Selic (CDI)": "inversa", "IPCA (inflação)": "media", "Spread crédito privado": "media", "Câmbio USD/BRL": "media", "Rating soberano BR": "alta" },
  },
  {
    nome: "ETFs globais (IVVB / NASD / GOLD)",
    sensibilidade: { "Selic (CDI)": "baixa", "IPCA (inflação)": "baixa", "Spread crédito privado": "baixa", "Câmbio USD/BRL": "alta", "Rating soberano BR": "baixa" },
  },
];

const SENS_COLOR = {
  alta: "var(--danger)",
  media: "var(--warning)",
  baixa: "var(--muted)",
  inversa: "var(--accent)",
};

export function DriversPage() {
  const [valores, setValores] = useState<Record<string, number>>(
    Object.fromEntries(DRIVERS.map((d) => [d.nome, d.hoje])),
  );
  const base = 1158157; // Familiar total aproximado

  const impactoTotal = useMemo(
    () => DRIVERS.reduce((s, d) => s + d.impacto(valores[d.nome], base), 0),
    [valores, base],
  );

  return (
    <>
      <div className="ph">
        <h1>Influenciadores</h1>
        <p>
          Variáveis macro que mais mexem no patrimônio. Ajuste os sliders e veja quanto cada
          driver adiciona ou tira do resultado anual estimado.
        </p>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-l">Impacto anual estimado</div>
          <div className={"kpi-v " + (impactoTotal >= 0 ? "good" : "bad")}>
            {impactoTotal >= 0 ? "+" : ""}R$ {Math.round(impactoTotal).toLocaleString("pt-BR")}
          </div>
          <div className="kpi-s">vs. cenário atual</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Base considerada</div>
          <div className="kpi-v blue">R$ {Math.round(base / 1000).toLocaleString("pt-BR")}k</div>
          <div className="kpi-s">consolidado familiar</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Drivers ativos</div>
          <div className="kpi-v">{DRIVERS.length}</div>
          <div className="kpi-s">macro + soberano + crédito</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Modelo</div>
          <div className="kpi-v" style={{ fontSize: 14 }}>linear · simplificado</div>
          <div className="kpi-s">1ª ordem de sensibilidade</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">Cenário</div>
        <div style={{ display: "grid", gap: 14 }}>
          {DRIVERS.map((d) => {
            const v = valores[d.nome];
            const imp = d.impacto(v, base);
            return (
              <div key={d.nome}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
                  <strong style={{ fontSize: 13 }}>{d.nome}</strong>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{d.descricao}</span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 12,
                      fontWeight: 600,
                      color: imp >= 0 ? "var(--success)" : "var(--danger)",
                    }}
                  >
                    {imp >= 0 ? "+" : ""}R$ {Math.round(imp).toLocaleString("pt-BR")}/ano
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="range"
                    min={d.min}
                    max={d.max}
                    step={d.step}
                    value={v}
                    onChange={(e) =>
                      setValores((s) => ({ ...s, [d.nome]: Number(e.target.value) }))
                    }
                    style={{ flex: 1 }}
                  />
                  <span style={{ minWidth: 90, textAlign: "right", fontSize: 13, fontWeight: 500 }}>
                    {v} {d.unidade}
                  </span>
                  <span style={{ minWidth: 60, textAlign: "right", fontSize: 11, color: "var(--muted)" }}>
                    hoje: {d.hoje}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        padding: "10px 14px",
        marginBottom: 14,
        background: "rgba(216,179,106,.10)",
        border: "1px solid rgba(216,179,106,.30)",
        borderRadius: "var(--radius)",
        fontSize: 12,
        color: "var(--muted)",
      }}>
        ⚠️ <strong>Modelo linear de 1ª ordem</strong> — coeficientes estimados. Use como orientação direcional, não como previsão. Impactos reais dependem de prazo, correlações e regime de mercado.
      </div>

      <div className="card">
        <div className="card-hdr">Matriz de sensibilidade <span>como cada classe reage</span></div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Classe</th>
                {DRIVERS.map((d) => (
                  <th key={d.nome} style={{ fontSize: 9 }}>{d.nome.split(" ")[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIZ.map((a) => (
                <tr key={a.nome}>
                  <td><strong>{a.nome}</strong></td>
                  {DRIVERS.map((d) => {
                    const s = a.sensibilidade[d.nome] ?? "baixa";
                    return (
                      <td key={d.nome}>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 10,
                            background: `color-mix(in oklab, ${SENS_COLOR[s]} 12%, transparent)`,
                            color: SENS_COLOR[s],
                            fontWeight: 600,
                          }}
                        >
                          {s}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
            <strong>alta</strong> = variação relevante · <strong>média</strong> = secundária ·{" "}
            <strong>baixa</strong> = quase inerte · <strong>inversa</strong> = anda ao contrário do driver.
          </div>
        </div>
      </div>
    </>
  );
}
