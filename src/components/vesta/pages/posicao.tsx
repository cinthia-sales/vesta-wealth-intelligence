import { useState } from "react";

import { getUser } from "@/data/vesta-users";
import { DIVIDEND_TICKERS } from "@/data/dividendos";
import { getSensibilidade, type Sensibilidade } from "@/data/sensibilidade";
import type { ProfileId } from "@/lib/profile-derive";

type Filter = "todos" | "intocavel" | "urgente" | "monitorar";

const SL = { intocavel: "sb-a", urgente: "sb-r", monitorar: "sb-w" } as const;
const ST = { intocavel: "intocável", urgente: "urgente", monitorar: "monitorar" } as const;

const IMPACTO_COR = {
  alto: { bg: "rgba(161,29,62,.12)", fg: "var(--accent)" },
  medio: { bg: "rgba(196,126,58,.12)", fg: "#C47E3A" },
  baixo: { bg: "rgba(74,124,89,.12)", fg: "#4E7A5C" },
} as const;

function fmtR(n: number) {
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
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
  const [sel, setSel] = useState<Sensibilidade | null>(null);
  const list = f === "todos" ? u.rf_ativos : u.rf_ativos.filter((r) => r.s === f);
  const total = list.reduce((s, r) => s + r.v, 0);
  const rv = u.rv_ativos ?? [];
  const showRV = u.rv > 0 && rv.length > 0;

  const openSens = (nome: string, classe?: string) => {
    const s = getSensibilidade(nome, classe);
    if (s) setSel(s);
  };

  const fb = (id: Filter, label: string) => (
    <button className={"fbtn" + (f === id ? " on" : "")} onClick={() => setF(id)}>
      {label}
    </button>
  );

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
        <div className="filter-row">
          {fb("todos", "Todos")}
          {fb("intocavel", "🔒 Intocáveis")}
          {fb("urgente", "🔴 Urgentes")}
          {fb("monitorar", "👁 Monitorar")}
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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.n} style={rowStyle} onClick={() => openSens(r.n)}>
                  <td>
                    <strong>{r.n}</strong>
                    <span style={{ marginLeft: 6, fontSize: 10, color: "var(--muted)" }}>ⓘ</span>
                    {r.nota && (
                      <>
                        <br />
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>{r.nota}</span>
                      </>
                    )}
                  </td>
                  <td className="r">{fmtR(r.v)}</td>
                  <td className="r">{r.t ? r.t.toFixed(2) + "%" : "—"}</td>
                  <td className="r">{r.cdi ? r.cdi.toFixed(1) + "% CDI" : "—"}</td>
                  <td>{r.venc}</td>
                  <td><span className={"sb " + SL[r.s]}>{ST[r.s]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showRV && (
        <div className="card">
          <div className="card-hdr">
            Renda variável <span>{rv.length} posições · {fmtR(u.rv)}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Ativo</th>
                  <th className="r">Valor atual</th>
                  <th className="r">PM / referência</th>
                  <th className="r">Rentabilidade</th>
                  <th>Classe</th>
                </tr>
              </thead>
              <tbody>
                {rv.map((r) => {
                  const ticker = r.n.split(" ")[0].replace(/[^A-Z0-9]/g, "");
                  const paysDiv = DIVIDEND_TICKERS.has(ticker);
                  return (
                  <tr key={r.n} style={rowStyle} onClick={() => openSens(r.n, r.cls)}>
                    <td>
                      <strong>{r.n}</strong>
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
                    </td>
                    <td className="r">{r.v}</td>
                    <td className="r">{r.pm}</td>
                    <td
                      className={"r " + (r.rc === "muted" ? "" : r.rc)}
                      style={r.rc === "muted" ? { color: "var(--muted)" } : undefined}
                    >
                      {r.r}
                    </td>
                    <td><span className={"sb " + r.sb}>{r.cls}</span></td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sel && <SensibilidadeModal s={sel} onClose={() => setSel(null)} />}
    </>
  );
}
