import { useState, useMemo } from "react";
import { getUser } from "@/data/vesta-users";
import type { ProfileId } from "@/lib/profile-derive";

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseValorBRL(s: string): number {
  return Number(
    String(s)
      .replace(/[^\d,.-]/g, "")
      .replace(/\.(?=\d{3})/g, "")
      .replace(",", ".")
  ) || 0;
}

/** "R$26,95 · 544 ações"  → { pm: 26.95, qty: 544, invested: 14660.8 }
    "Aplicado R$50.000"   → { pm: null, qty: null, invested: 50000 }
    "R$122,75 · 165 cotas" → { pm: 122.75, qty: 165, invested: 20253.75 } */
function parsePM(pm: string, valorAtual: number): { pm: number | null; qty: number | null; invested: number } {
  const aplicado = pm.match(/Aplicado\s*R?\$?\s*([\d.,]+)/i);
  if (aplicado) return { pm: null, qty: null, invested: parseValorBRL(aplicado[1]) };
  const match = pm.match(/R?\$?\s*([\d.,]+)\s*[·•]\s*([\d.,]+)/);
  if (match) {
    const pmVal = parseValorBRL(match[1]);
    const qty = parseValorBRL(match[2]);
    return { pm: pmVal, qty, invested: pmVal * qty };
  }
  // fallback: use valor atual como "invested" (neutro)
  return { pm: null, qty: null, invested: valorAtual };
}

function fmtPct(n: number, digits = 1) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

function fmtR(n: number) {
  const sign = n >= 0 ? "+" : "−";
  return `${n >= 0 ? "+" : ""}R$ ${Math.abs(Math.round(n)).toLocaleString("pt-BR")}`;
}

function fmtRabs(n: number) {
  return `R$ ${Math.round(Math.abs(n)).toLocaleString("pt-BR")}`;
}

// CDI composto para N anos
function cdiComposton(cdiAno: number, anos: number): number {
  return Math.pow(1 + cdiAno / 100, anos) - 1;
}

// CAGR de um retorno total em N anos
function cagr(totalReturnPct: number, anos: number): number {
  return Math.pow(1 + totalReturnPct / 100, 1 / Math.max(anos, 0.1)) - 1;
}

// ── Tipos ────────────────────────────────────────────────────────────────────

interface AtivoAuditoria {
  ticker: string;
  nome: string;
  cls: string;
  valorAtual: number;
  invested: number;
  pm: number | null;
  qty: number | null;
  // estado do usuário
  dividendos: string;   // R$ recebidos total (input)
  anos: string;         // período em anos (input)
}

// ── Componente principal ─────────────────────────────────────────────────────

export function AuditoriaPage({ profileId }: { profileId: ProfileId }) {
  const user = getUser(profileId);
  const [cdiAno, setCdiAno] = useState("14.75");
  const [mostrarETF, setMostrarETF] = useState(false);

  // Inicializa ativos a partir do perfil
  const [ativos, setAtivos] = useState<AtivoAuditoria[]>(() => {
    const rv = user?.rv_ativos ?? [];
    return rv
      .filter(a => {
        const cls = (a.cls ?? "").toLowerCase();
        return cls === "ação" || cls === "fii" || cls === "fi" || cls === "etf";
      })
      .map(a => {
        const vStr = String(a.v ?? "0");
        const valorAtual = parseValorBRL(vStr.replace(/\s/g, "").replace("R$", ""));
        const pmParsed = parsePM(String(a.pm ?? ""), valorAtual);
        return {
          ticker: String(a.n ?? "").split(" ")[0].replace(/\[.*?\]/g, "").trim(),
          nome: String(a.n ?? ""),
          cls: (a.cls ?? "ação"),
          valorAtual,
          invested: pmParsed.invested,
          pm: pmParsed.pm,
          qty: pmParsed.qty,
          dividendos: "",
          anos: "3",
        };
      });
  });

  function updateAtivo(idx: number, patch: Partial<AtivoAuditoria>) {
    setAtivos(prev => prev.map((a, i) => i === idx ? { ...a, ...patch } : a));
  }

  const cdiRate = parseFloat(cdiAno) || 14.75;

  const resultados = useMemo(() => ativos.map(a => {
    const div = parseFloat(a.dividendos.replace(",", ".")) || 0;
    const anos = parseFloat(a.anos.replace(",", ".")) || 3;
    const capitalGain = a.valorAtual - a.invested;
    const totalReturn = capitalGain + div;
    const totalReturnPct = a.invested > 0 ? (totalReturn / a.invested) * 100 : 0;
    const cagrVal = cagr(totalReturnPct, anos) * 100;
    const cdiTotal = cdiComposton(cdiRate, anos) * 100;
    const cdiGanhoAbsoluto = a.invested * (cdiTotal / 100);
    const deltaVsCdi = totalReturn - cdiGanhoAbsoluto;
    const bateuCdi = deltaVsCdi > 0;
    const capitalGainPct = a.invested > 0 ? (capitalGain / a.invested) * 100 : 0;
    return {
      capitalGain, capitalGainPct,
      div, totalReturn, totalReturnPct,
      cagrVal, cdiTotal, cdiGanhoAbsoluto, deltaVsCdi, bateuCdi, anos
    };
  }), [ativos, cdiRate]);

  const visiveisIdx = ativos
    .map((a, i) => ({ a, i }))
    .filter(({ a }) => mostrarETF || a.cls.toLowerCase() !== "etf")
    .map(({ i }) => i);

  // Totais
  const totalInvested = visiveisIdx.reduce((s, i) => s + ativos[i].invested, 0);
  const totalAtual = visiveisIdx.reduce((s, i) => s + ativos[i].valorAtual, 0);
  const totalDiv = visiveisIdx.reduce((s, i) => s + (parseFloat(ativos[i].dividendos.replace(",", ".")) || 0), 0);
  const totalReturnGlobal = (totalAtual - totalInvested) + totalDiv;
  const totalReturnGlobalPct = totalInvested > 0 ? (totalReturnGlobal / totalInvested) * 100 : 0;
  const anosRef = parseFloat(ativos[0]?.anos ?? "3") || 3;
  const cdiTotalRef = cdiComposton(cdiRate, anosRef) * 100;
  const cdiGanhoRef = totalInvested * (cdiTotalRef / 100);
  const bateuGlobal = totalReturnGlobal > cdiGanhoRef;

  return (
    <div className="ph" style={{ maxWidth: 680, margin: "0 auto", paddingBottom: 48 }}>
      <h1 style={{ marginBottom: 4 }}>Auditoria de Ações</h1>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>
        Retorno total real = ganho/perda de capital <strong>+</strong> dividendos recebidos.
        Comparado com o que a Renda Fixa teria dado no mesmo período.
      </p>

      {/* Parâmetros globais */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28, alignItems: "center" }}>
        <label style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
          CDI usado na comparação (%/ano):
          <input
            type="number"
            value={cdiAno}
            onChange={e => setCdiAno(e.target.value)}
            style={{ width: 64, padding: "3px 6px", borderRadius: 4, border: "1px solid var(--border)", fontSize: 12, textAlign: "right" }}
          />
        </label>
        <label style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={mostrarETF} onChange={e => setMostrarETF(e.target.checked)} />
          Incluir ETFs
        </label>
      </div>

      {/* Resumo consolidado */}
      {visiveisIdx.length > 0 && (
        <div style={{
          background: bateuGlobal ? "rgba(74,124,89,.08)" : "rgba(161,29,62,.07)",
          border: `1.5px solid ${bateuGlobal ? "rgba(74,124,89,.3)" : "rgba(161,29,62,.25)"}`,
          borderRadius: 10, padding: "14px 16px", marginBottom: 28,
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12
        }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5 }}>Total investido</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{fmtRabs(totalInvested)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5 }}>Valor atual + dividendos</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{fmtRabs(totalAtual + totalDiv)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .5 }}>Retorno total real</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: totalReturnGlobal >= 0 ? "#16a34a" : "#dc2626" }}>
              {fmtR(totalReturnGlobal)} ({fmtPct(totalReturnGlobalPct)})
            </div>
          </div>
          <div style={{ gridColumn: "1 / -1", borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 2 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              CDI de {anosRef} anos teria rendido{" "}
              <strong>{fmtRabs(cdiGanhoRef)}</strong> ({fmtPct(cdiTotalRef)}).{" "}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: bateuGlobal ? "#16a34a" : "#dc2626"
            }}>
              {bateuGlobal
                ? `✓ Carteira bateu o CDI em ${fmtRabs(totalReturnGlobal - cdiGanhoRef)}`
                : `✗ Carteira perdeu para o CDI em ${fmtRabs(Math.abs(totalReturnGlobal - cdiGanhoRef))}`}
            </span>
          </div>
        </div>
      )}

      {/* Tabela por ativo */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visiveisIdx.map(i => {
          const a = ativos[i];
          const r = resultados[i];
          const cor = r.bateuCdi ? "#16a34a" : r.totalReturn < 0 ? "#dc2626" : "#d97706";

          return (
            <div key={i} style={{
              border: "1px solid var(--border)",
              borderLeft: `4px solid ${cor}`,
              borderRadius: 8, padding: "12px 14px",
              background: "var(--card-bg, white)"
            }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{a.ticker}</span>
                  <span style={{
                    fontSize: 10, marginLeft: 6, padding: "1px 6px",
                    borderRadius: 10, background: "var(--muted-bg, #f0f0f0)",
                    color: "var(--muted)", textTransform: "uppercase"
                  }}>{a.cls}</span>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: cor
                }}>
                  {r.bateuCdi ? "✓ bateu CDI" : r.totalReturn < 0 ? "✗ resultado negativo" : "✗ perdeu pro CDI"}
                </span>
              </div>

              {/* Números do capital */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12, fontSize: 12 }}>
                <div>
                  <div style={{ color: "var(--muted)", fontSize: 10, marginBottom: 2 }}>INVESTIDO</div>
                  <div style={{ fontWeight: 600 }}>{fmtRabs(a.invested)}</div>
                  {a.pm && a.qty && (
                    <div style={{ color: "var(--muted)", fontSize: 10 }}>
                      {a.qty.toLocaleString("pt-BR")} × R${a.pm.toFixed(2).replace(".", ",")}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ color: "var(--muted)", fontSize: 10, marginBottom: 2 }}>VALOR ATUAL</div>
                  <div style={{ fontWeight: 600 }}>{fmtRabs(a.valorAtual)}</div>
                </div>
                <div>
                  <div style={{ color: "var(--muted)", fontSize: 10, marginBottom: 2 }}>CAPITAL ± (sem dividendos)</div>
                  <div style={{ fontWeight: 600, color: r.capitalGain >= 0 ? "#16a34a" : "#dc2626" }}>
                    {fmtR(r.capitalGain)} ({fmtPct(r.capitalGainPct)})
                  </div>
                </div>
              </div>

              {/* Inputs + cálculo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "end", marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: "var(--muted)" }}>
                  Dividendos / rendimentos recebidos total (R$)
                  <input
                    type="number"
                    placeholder="0"
                    value={a.dividendos}
                    onChange={e => updateAtivo(i, { dividendos: e.target.value })}
                    style={{ display: "block", width: "100%", marginTop: 4, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--border)", fontSize: 12 }}
                  />
                </label>
                <label style={{ fontSize: 11, color: "var(--muted)" }}>
                  Período de holding (anos)
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={a.anos}
                    onChange={e => updateAtivo(i, { anos: e.target.value })}
                    style={{ display: "block", width: "100%", marginTop: 4, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--border)", fontSize: 12 }}
                  />
                </label>
              </div>

              {/* Resultado total */}
              <div style={{
                background: r.bateuCdi ? "rgba(74,124,89,.07)" : "rgba(161,29,62,.06)",
                borderRadius: 6, padding: "8px 10px",
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 11
              }}>
                <div>
                  <div style={{ color: "var(--muted)", marginBottom: 2 }}>RETORNO TOTAL REAL</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: r.totalReturn >= 0 ? "#16a34a" : "#dc2626" }}>
                    {fmtR(r.totalReturn)}
                  </div>
                  <div style={{ color: "var(--muted)" }}>{fmtPct(r.totalReturnPct)} no período</div>
                </div>
                <div>
                  <div style={{ color: "var(--muted)", marginBottom: 2 }}>CAGR EFETIVO</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: r.cagrVal >= cdiRate ? "#16a34a" : r.cagrVal >= 0 ? "#d97706" : "#dc2626" }}>
                    {fmtPct(r.cagrVal)}/ano
                  </div>
                  <div style={{ color: "var(--muted)" }}>CDI: +{cdiRate.toFixed(2)}%/ano</div>
                </div>
                <div>
                  <div style={{ color: "var(--muted)", marginBottom: 2 }}>CDI teria rendido</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {fmtRabs(r.cdiGanhoAbsoluto)}
                  </div>
                  <div style={{ color: r.bateuCdi ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                    {r.bateuCdi
                      ? `✓ ganho extra: ${fmtRabs(r.deltaVsCdi)}`
                      : `✗ custo de oportunidade: ${fmtRabs(Math.abs(r.deltaVsCdi))}`}
                  </div>
                </div>
              </div>

              {/* Nota explicativa para casos ruins */}
              {!r.bateuCdi && (
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, fontStyle: "italic" }}>
                  {r.capitalGain < 0 && r.div > 0
                    ? `Recebeu ${fmtRabs(r.div)} em dividendos, mas perdeu ${fmtRabs(Math.abs(r.capitalGain))} no capital. O dividendo não compensa a perda do bolo.`
                    : r.capitalGain < 0
                    ? `Capital perdido: ${fmtRabs(Math.abs(r.capitalGain))}. Sem dividendos registrados para compensar.`
                    : `Ganho de capital positivo, mas abaixo do que a RF renderia sem risco.`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {visiveisIdx.length === 0 && (
        <div style={{ color: "var(--muted)", textAlign: "center", marginTop: 40 }}>
          Nenhum ativo de renda variável encontrado para este perfil.
        </div>
      )}

      <div style={{ marginTop: 24, padding: "12px 14px", background: "var(--muted-bg, #f5f5f5)", borderRadius: 8, fontSize: 11, color: "var(--muted)" }}>
        <strong>Como preencher:</strong> em "Dividendos" coloque o <em>total bruto recebido desde a compra</em> (JCP + proventos + aluguéis de FII etc). Em "Período" coloque quantos anos você tem a posição. O CAGR calculado pode ser comparado diretamente com qualquer LCI ou CDB que cite taxa %/ano.
      </div>
    </div>
  );
}
