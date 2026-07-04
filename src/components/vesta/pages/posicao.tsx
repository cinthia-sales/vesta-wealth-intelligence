import { useState } from "react";

import { getUser } from "@/data/vesta-users";
import type { ProfileId } from "@/lib/profile-derive";

type Filter = "todos" | "intocavel" | "urgente" | "monitorar";

const SL = { intocavel: "sb-a", urgente: "sb-r", monitorar: "sb-w" } as const;
const ST = { intocavel: "intocável", urgente: "urgente", monitorar: "monitorar" } as const;

function fmtR(n: number) {
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}

export function PosicaoPage({ profileId }: { profileId: ProfileId }) {
  const u = getUser(profileId);
  const [f, setF] = useState<Filter>("todos");
  const list = f === "todos" ? u.rf_ativos : u.rf_ativos.filter((r) => r.s === f);
  const total = list.reduce((s, r) => s + r.v, 0);
  const rv = u.rv_ativos ?? [];
  const showRV = u.rv > 0 && rv.length > 0;

  const fb = (id: Filter, label: string) => (
    <button className={"fbtn" + (f === id ? " on" : "")} onClick={() => setF(id)}>
      {label}
    </button>
  );

  return (
    <>
      <div className="ph">
        <h1>Posição atual</h1>
        <p>
          {profileId === "familiar"
            ? "Ativos consolidados de Paulo e Cinthia."
            : `Ativos da carteira ${u.nome} · ${u.conta}.`}
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
                <tr key={r.n}>
                  <td>
                    <strong>{r.n}</strong>
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
                {rv.map((r) => (
                  <tr key={r.n}>
                    <td><strong>{r.n}</strong></td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
