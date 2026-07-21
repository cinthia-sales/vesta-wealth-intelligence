import { useState } from "react";

import { getUser } from "@/data/vesta-users";
import { DIVIDEND_TICKERS } from "@/data/dividendos";
import { getSensibilidade, type Sensibilidade } from "@/data/sensibilidade";
import type { ProfileId } from "@/lib/profile-derive";
import { getAssetLockReason, isAssetLocked, removeAssetLock, setAssetLocked } from "@/data/asset-locks";

type Filter = "todos" | "intocavel" | "urgente" | "monitorar" | "estrategico" | "planejar";

const SL = { intocavel: "sb-a", urgente: "sb-r", monitorar: "sb-w", estrategico: "sb-a", planejar: "sb-w" } as const;
const ST = { intocavel: "intocável", urgente: "urgente", monitorar: "monitorar", estrategico: "estratégico", planejar: "planejar" } as const;

const IMPACTO_COR = {
  alto: { bg: "rgba(161,29,62,.12)", fg: "var(--accent)" },
  medio: { bg: "rgba(196,126,58,.12)", fg: "#C47E3A" },
  baixo: { bg: "rgba(74,124,89,.12)", fg: "#4E7A5C" },
} as const;

function fmtR(n: number) {
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}

function splitReferencia(pm: string) {
  const normalized = pm.replace(/\s*[·-]\s*Importado XP\s*/gi, "").replace(/\s*Importado XP\s*/gi, "").replace(/\s+/g, " ").trim();
  if (!normalized) return { pm: "—", cotacao: "—", qtd: "—" };
  const pmMatch = normalized.match(/PM\s*(R\$\s*[\d.,]+)/i) ?? normalized.match(/^(R\$\s*[\d.,]+)/i);
  const cotMatch = normalized.match(/Cot\.?\s*(R\$\s*[\d.,]+)/i);
  const qtdMatch = normalized.match(/([\d.]+)\s*(cotas|ações|ações|títulos|titulos)/i);
  const aplicadoMatch = normalized.match(/Aplicado\s*(R\$\s*[\d.,]+)/i);
  return {
    pm: pmMatch?.[1] ?? aplicadoMatch?.[1] ?? normalized,
    cotacao: cotMatch?.[1] ?? "—",
    qtd: qtdMatch ? `${qtdMatch[1]} ${qtdMatch[2].replace("ações", "ações")}` : "—",
  };
}

function parsePercent(value: string) {
  const n = Number(value.replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseMoney(value: string) {
  const n = Number(value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function precoVsPM(ref: ReturnType<typeof splitReferencia>) {
  const pm = parseMoney(ref.pm);
  const cotacao = parseMoney(ref.cotacao);
  if (pm === null || cotacao === null || pm <= 0) return null;
  return ((cotacao / pm) - 1) * 100;
}

function cleanImported(value: string) {
  return value.replace(/\s*[·-]\s*Importado XP\s*/gi, "").replace(/\s*Importado XP\s*/gi, "").trim() || "—";
}

function statusDot(status: Filter) {
  if (status === "urgente") return "dr";
  if (status === "monitorar" || status === "planejar") return "dw";
  return "dg";
}

function StatusInline({ status }: { status: Filter }) {
  return (
    <span className="position-dot-only" title={ST[status as keyof typeof ST]}>
      <span className={"dot " + statusDot(status)} style={{ marginTop: 0 }} />
    </span>
  );
}

function classifyRF(r: ReturnType<typeof getUser>["rf_ativos"][number]): Filter {
  const nota = r.nota ?? "";
  const notaPct = parsePercent(nota);
  if (/taxa xp|taxa|administra/i.test(nota) && notaPct !== null && notaPct > 2) return "urgente";
  if (/FIF|FIC|FIDC|Fundo|Riza/i.test(r.n) && /taxa xp|taxa|administra/i.test(nota)) return "urgente";
  if (typeof r.cdi === "number") {
    if (r.cdi < 90) return "urgente";
    if (r.cdi < 95) return "monitorar";
    return "intocavel";
  }
  if (/LFT|Tesouro|NTN-B|LTN/i.test(r.n)) return "monitorar";
  if (typeof r.t === "number") {
    if (r.t < 13.3) return "urgente";
    if (r.t < 14.5) return "monitorar";
    return "intocavel";
  }
  return r.s;
}

function classifyRV(r: NonNullable<ReturnType<typeof getUser>["rv_ativos"]>[number]): Filter {
  const retorno = parsePercent(r.retorno_posicao ?? r.r);
  const ref = splitReferencia(r.pm);
  const pm = parseMoney(ref.pm);
  const cotacao = parseMoney(ref.cotacao);
  if (pm !== null && cotacao !== null && cotacao < pm) return "urgente";
  if (r.rc === "bad" || /^-/.test((r.retorno_posicao ?? r.r).trim()) || (retorno !== null && retorno < 0)) return "urgente";
  if (retorno !== null && retorno < 13.3) return "monitorar";
  if (r.rc === "good") return "intocavel";
  return "monitorar";
}

function SensibilidadeModal({ s, onClose }: { s: Sensibilidade; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card, #1a1416)",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 12,
          maxWidth: 620,
          width: "100%",
          maxHeight: "88vh",
          overflowY: "auto",
          padding: "20px 22px",
          boxShadow: "0 20px 60px rgba(0,0,0,.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)" }}>
              {s.classe}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{s.titulo}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,.15)",
              color: "var(--muted)",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, margin: "10px 0 14px" }}>
          {s.resumo}
        </p>

        {s.observacao && (
          <div
            style={{
              fontSize: 12,
              padding: "10px 12px",
              background: "var(--warning-bg, rgba(196,126,58,.1))",
              border: "1px solid rgba(196,126,58,.35)",
              borderRadius: 8,
              color: "#C47E3A",
              marginBottom: 14,
              lineHeight: 1.5,
            }}
          >
            <strong>Observação:</strong> {s.observacao}
          </div>
        )}

        <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
          Sensível a
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {s.fatores.map((f) => {
            const cor = IMPACTO_COR[f.impacto];
            return (
              <div
                key={f.nome}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  background: "rgba(255,255,255,.02)",
                  border: "1px solid rgba(255,255,255,.06)",
                  borderRadius: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: ".05em",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: cor.bg,
                    color: cor.fg,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    marginTop: 1,
                  }}
                >
                  {f.impacto}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.nome}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.45 }}>
                    {f.direcao}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
          Fontes de referência
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {s.fontes.map((f) => (
            <a
              key={f.label}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 12,
                padding: "5px 10px",
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 6,
                color: "var(--accent)",
                textDecoration: "none",
              }}
            >
              {f.label} ↗
            </a>
          ))}
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: "var(--muted)", lineHeight: 1.5, fontStyle: "italic" }}>
          Informação curada e estática. Monitoramento diário de índices e alertas de mercado — próxima rodada.
        </div>
      </div>
    </div>
  );
}

export function PosicaoPage({ profileId }: { profileId: ProfileId }) {
  const u = getUser(profileId);
  const [f, setF] = useState<Filter>("todos");
  const [fRV, setFRV] = useState<Filter>("todos");
  const [sel, setSel] = useState<Sensibilidade | null>(null);
  const [lockVersion, setLockVersion] = useState(0);
  const rfDecorada = u.rf_ativos.map((r) => {
    const locked = isAssetLocked(profileId, r.n);
    return {
      ...r,
      locked,
      lockReason: getAssetLockReason(profileId, r.n),
      statusCalculado: classifyRF(r),
    };
  });
  const list = f === "todos" ? rfDecorada : rfDecorada.filter((r) => r.statusCalculado === f);
  const total = list.reduce((s, r) => s + r.v, 0);
  const rfCounts = rfDecorada.reduce(
    (acc, r) => {
      const k = r.statusCalculado as string;
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    { intocavel: 0, urgente: 0, monitorar: 0 } as Record<string, number>,
  );
  const lockedCount = rfDecorada.filter((r) => r.locked).length;
  const rv = u.rv_ativos ?? [];
  const showRV = u.rv > 0 && rv.length > 0;
  const rvDecorada = rv.map((r) => ({ ...r, statusCalculado: classifyRV(r) }));
  const rvCounts = rvDecorada.reduce(
    (acc, r) => { acc[r.statusCalculado] = (acc[r.statusCalculado] ?? 0) + 1; return acc; },
    { intocavel: 0, urgente: 0, monitorar: 0 } as Record<string, number>,
  );
  const rvList = fRV === "todos" ? rvDecorada : rvDecorada.filter((r) => r.statusCalculado === fRV);

  const openSens = (nome: string, classe?: string) => {
    const s = getSensibilidade(nome, classe);
    if (s) setSel(s);
  };

  const fb = (id: Filter, label: string, count?: number, dot?: "dg" | "dr" | "dw") => (
    <button className={"fbtn" + (f === id ? " on" : "")} onClick={() => setF(id)}>
      {dot && <span className={"dot " + dot} />}
      {label}
      {typeof count === "number" && <span className="filter-count">{count}</span>}
    </button>
  );

  const toggleLock = (assetName: string) => {
    if (isAssetLocked(profileId, assetName)) removeAssetLock(profileId, assetName);
    else setAssetLocked(profileId, assetName);
    setLockVersion((v) => v + 1);
  };

  const rowStyle: React.CSSProperties = { cursor: "pointer" };

  return (
    <>
      <div className="ph">
        <h1>Posição atual</h1>
        <p>
          {profileId === "familiar"
            ? "Ativos consolidados de Paulo e Cinthia."
            : `Ativos da carteira ${u.nome} · ${u.conta}.`}
          {" "}
          <span style={{ color: "var(--muted)", fontSize: 12 }}>· clique num ativo para ver a que ele é sensível</span>
        </p>
      </div>

      {profileId === "cinthia" && (
        <div
          style={{
            background: "var(--warning-bg)",
            border: "1px solid var(--warning)",
            borderRadius: "var(--radius)",
            padding: "12px 16px",
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          <strong style={{ color: "var(--warning)" }}>⚠️ LCD BRDE FEV/2036 (92,5% CDI)</strong> — taxa
          flutuante por 10 anos: quando a Selic cair, o rendimento cai junto.
        </div>
      )}

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Renda fixa <span>{list.length} ativos · {fmtR(total)}</span>
        </div>
        <div className="filter-row position-filter-row">
          {fb("todos", "Todos", rfDecorada.length)}
          {fb("intocavel", "Bons", rfCounts.intocavel, "dg")}
          {fb("urgente", "Urgentes", rfCounts.urgente, "dr")}
          {fb("monitorar", "Monitorar", rfCounts.monitorar, "dw")}
          {lockedCount > 0 && (
            <span className="lock-filter-note" title="Travado por deságio, breakeven ou decisão temporária da Vesta">
              🔒 {lockedCount} travado(s)
            </span>
          )}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Ativo</th>
                <th className="r">Valor</th>
                <th className="r">Taxa líq./ano</th>
                <th className="r">% CDI equiv.</th>
                <th>Vencimento</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.n} style={rowStyle} onClick={() => openSens(r.n)}>
                  <td>
                    <StatusInline status={r.statusCalculado} />
                    <strong>{r.n}</strong>
                    <button
                      className={"lock-mini-btn" + (r.locked ? " on" : "")}
                      onClick={(ev) => { ev.stopPropagation(); toggleLock(r.n); }}
                      title={r.locked ? r.lockReason : "Travar por deságio, breakeven ou decisão da Vesta"}
                    >
                      {r.locked ? "🔒" : "travar"}
                    </button>
                    <span style={{ marginLeft: 6, fontSize: 10, color: "var(--muted)" }}>ⓘ</span>
                    {r.nota && (
                      <>
                        <br />
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>{r.nota}</span>
                      </>
                    )}
                    {r.locked && (
                      <>
                        <br />
                        <span style={{ fontSize: 11, color: "var(--success)" }}>
                          🔒 travado pela Vesta · {r.lockReason}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="r">{fmtR(r.v)}</td>
                  <td className="r">{r.t ? r.t.toFixed(2) + "%" : "—"}</td>
                  <td className="r">{r.cdi ? r.cdi.toFixed(1) + "% CDI" : "—"}</td>
                  <td>{r.venc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showRV && (
        <div className="card">
          <div className="card-hdr">
            Renda variável <span>{rvList.length} posições · {fmtR(u.rv)}</span>
          </div>
          <div className="filter-row position-filter-row">
            {(() => {
              const fbRV = (id: Filter, label: string, count?: number, dot?: "dg" | "dr" | "dw") => (
                <button key={id} className={"fbtn" + (fRV === id ? " on" : "")} onClick={() => setFRV(id)}>
                  {dot && <span className={"dot " + dot} />}
                  {label}
                  {typeof count === "number" && <span className="filter-count">{count}</span>}
                </button>
              );
              return (
                <>
                  {fbRV("todos", "Todos", rvDecorada.length)}
                  {fbRV("intocavel", "Bons", rvCounts.intocavel, "dg")}
                  {fbRV("urgente", "Urgentes", rvCounts.urgente, "dr")}
                  {fbRV("monitorar", "Monitorar", rvCounts.monitorar, "dw")}
                </>
              );
            })()}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Ativo</th>
                <th className="r">Valor atual</th>
                <th className="r">PM</th>
                <th className="r">Cota atual</th>
                <th className="r">Qtd.</th>
                <th className="r" title="Variação acumulada contra o preço médio. Não é ao ano, não inclui proventos e não informa o tempo investido.">Acum. vs PM</th>
                <th>Classe</th>
              </tr>
              </thead>
              <tbody>
                {rvList.map((r) => {
                  const ticker = r.n.split(" ")[0].replace(/[^A-Z0-9]/g, "");
                  const paysDiv = DIVIDEND_TICKERS.has(ticker);
                  const ref = splitReferencia(r.pm);
                  const precoPM = precoVsPM(ref);
                  const rvLocked = isAssetLocked(profileId, r.n);
                  const rvStatus = r.statusCalculado;
                  return (
                  <tr key={r.n} style={rowStyle} onClick={() => openSens(r.n, r.cls)}>
                    <td>
                      <StatusInline status={rvStatus} />
                      <strong>{r.n}</strong>
                      <button
                        className={"lock-mini-btn" + (rvLocked ? " on" : "")}
                        onClick={(ev) => { ev.stopPropagation(); toggleLock(r.n); }}
                        title={rvLocked ? getAssetLockReason(profileId, r.n) : "Travar por deságio, breakeven ou decisão da Vesta"}
                      >
                        {rvLocked ? "🔒" : "travar"}
                      </button>
                      <span style={{ marginLeft: 6, fontSize: 10, color: "var(--muted)" }}>ⓘ</span>
                      {paysDiv && (
                        <span
                          title="Paga proventos recorrentes"
                          style={{
                            marginLeft: 6,
                            fontSize: 10,
                            padding: "1px 6px",
                            borderRadius: 8,
                            background: "rgba(74,124,89,.15)",
                            color: "var(--good, #4E7A5C)",
                            border: "1px solid rgba(74,124,89,.35)",
                            fontWeight: 600,
                            letterSpacing: ".03em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          💰 provento
                        </span>
                      )}
                      {r.come_cotas_aviso && (
                        <span
                          title="Come-cotas semestral (mai/nov)"
                          style={{
                            marginLeft: 6,
                            fontSize: 10,
                            padding: "1px 6px",
                            borderRadius: 8,
                            background: "rgba(216,179,106,.15)",
                            color: "#B8734A",
                            border: "1px solid rgba(216,179,106,.35)",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.come_cotas_aviso}
                        </span>
                      )}
                      {rvLocked && (
                        <>
                          <br />
                          <span style={{ fontSize: 11, color: "var(--success)" }}>
                            🔒 travado pela Vesta · {getAssetLockReason(profileId, r.n)}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="r">{r.v}</td>
                    <td className="r">{ref.pm}</td>
                    <td className="r">{ref.cotacao}</td>
                    <td className="r">{ref.qtd}</td>
                    <td
                      className={"r " + (r.rc === "muted" ? "" : r.rc)}
                      style={r.rc === "muted" ? { color: "var(--muted)" } : undefined}
                    >
                      {precoPM !== null ? (
                        <span
                          title="Acumulado contra o preço médio. Não é taxa ao ano; não inclui proventos nem inflação. Tempo investido não veio no arquivo."
                          style={{ color: precoPM < 0 ? "var(--danger)" : "#4E7A5C", fontWeight: 700 }}
                        >
                          {precoPM > 0 ? "+" : ""}{precoPM.toFixed(1).replace(".", ",")}%
                        </span>
                      ) : r.retorno_posicao && r.retorno_fundo_historico ? (
                        <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                          <span style={{ color: "var(--danger)", fontWeight: 600, fontSize: 12 }}>
                            Posição: {r.retorno_posicao}
                          </span>
                          <span style={{ color: "var(--muted)", fontSize: 11 }}>
                            Fundo desde início: {r.retorno_fundo_historico}
                          </span>
                        </span>
                      ) : (
                        <span title="Rentabilidade importada pela XP. Base e período não vieram no arquivo.">
                          {cleanImported(r.r)}
                        </span>
                      )}
                    </td>
                    <td><span className={"sb " + r.sb}>{r.cls}</span></td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
            <strong>Acum. vs PM</strong> não é rentabilidade ao ano: usa cota atual contra preço médio e não inclui proventos nem inflação.
            Sem data de compra, o tempo investido fica indeterminado; a leitura completa fica em Rendimentos recorrentes / Provento não é lucro.
          </div>
        </div>
      )}

      {sel && <SensibilidadeModal s={sel} onClose={() => setSel(null)} />}
    </>
  );
}

