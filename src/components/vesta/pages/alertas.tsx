import { useMemo, useState } from "react";

import { getUser } from "@/data/vesta-users";
import type { ProfileId } from "@/lib/profile-derive";

type Sev = "r" | "w" | "g";
const SEV_LABEL: Record<Sev, string> = { r: "urgente", w: "atenção", g: "positivo" };
const SEV_CLASS: Record<Sev, string> = { r: "sb-r", w: "sb-w", g: "sb-g" };

function daysUntil(dmy: string) {
  const [d, m, y] = dmy.split("/").map(Number);
  if (!d || !m || !y) return null;
  const target = new Date(y, m - 1, d);
  const hoje = new Date(2026, 6, 4); // ref 04/07/2026
  return Math.round((target.getTime() - hoje.getTime()) / 86400000);
}

export function AlertasPage({ profileId }: { profileId: ProfileId }) {
  const u = getUser(profileId);
  const [filtro, setFiltro] = useState<"todos" | Sev>("todos");

  // Enriquecer com dias até vencimento quando o det tem data
  const alertas = useMemo(() => {
    return u.alertas_list.map((a) => {
      const match = a.det.match(/(\d{2}\/\d{2}\/\d{4})/);
      const dias = match ? daysUntil(match[1]) : null;
      return { ...a, dias };
    });
  }, [u]);

  const filtered = filtro === "todos" ? alertas : alertas.filter((a) => a.cor === filtro);

  const counts = {
    r: alertas.filter((a) => a.cor === "r").length,
    w: alertas.filter((a) => a.cor === "w").length,
    g: alertas.filter((a) => a.cor === "g").length,
  };

  const proximosVenc = u.vencimentos.slice(0, 5);

  const fb = (id: typeof filtro, label: string, count?: number) => (
    <button className={"fbtn" + (filtro === id ? " on" : "")} onClick={() => setFiltro(id)}>
      {label}
      {typeof count === "number" && (
        <span style={{ marginLeft: 6, opacity: 0.7 }}>({count})</span>
      )}
    </button>
  );

  return (
    <>
      <div className="ph">
        <h1>Alertas</h1>
        <p>
          Situações da carteira que exigem decisão. Ordenadas por severidade e proximidade de
          vencimento.
        </p>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-l">Urgentes</div>
          <div className="kpi-v bad">{counts.r}</div>
          <div className="kpi-s">decisão nas próximas semanas</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Atenção</div>
          <div className="kpi-v warn">{counts.w}</div>
          <div className="kpi-s">monitorar / preparar</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Positivos</div>
          <div className="kpi-v good">{counts.g}</div>
          <div className="kpi-s">ganhos garantidos / provisionados</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Próximo vencimento</div>
          <div className="kpi-v blue">
            {proximosVenc[0]?.det.match(/(\d{2}\/\d{2}\/\d{4})/)?.[1] ?? "—"}
          </div>
          <div className="kpi-s">{proximosVenc[0]?.nome ?? ""}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Feed de alertas <span>{filtered.length} item(s)</span>
        </div>
        <div className="filter-row">
          {fb("todos", "Todos", alertas.length)}
          {fb("r", "🔴 Urgentes", counts.r)}
          {fb("w", "🟡 Atenção", counts.w)}
          {fb("g", "🟢 Positivos", counts.g)}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            Nenhum alerta nesse filtro.
          </div>
        )}

        {filtered.map((a, i) => (
          <div key={i} className={"alert-full " + a.cor} style={{ marginBottom: 10 }}>
            <div className="alert-full-hdr">
              <span className={"sb " + SEV_CLASS[a.cor]}>{SEV_LABEL[a.cor]}</span>
              <strong className="alert-full-ttl">{a.titulo}</strong>
              {a.dias !== null && a.dias !== undefined && a.dias >= 0 && (
                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>
                  em {a.dias} dias
                </span>
              )}
            </div>
            <div className="alert-full-body">{a.det}</div>
            <AlertAction titulo={a.titulo} cor={a.cor} />
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-hdr">
          Próximos vencimentos <span>agenda de caixa</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Ativo</th>
                <th>Detalhes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {u.vencimentos.map((v, i) => (
                <tr key={i}>
                  <td>
                    <span style={{ marginRight: 8 }}>{v.icon}</span>
                    <strong>{v.nome}</strong>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{v.det}</td>
                  <td><span className={"sb " + v.bc}>{v.badge}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function AlertAction({ titulo, cor }: { titulo: string; cor: Sev }) {
  // Roteia sugestões contextuais com base no título do alerta
  let msg: string | null = null;
  if (/NTN-B AGO\/2026/i.test(titulo))
    msg = "→ Sugestão: travar em NTN-B 2035 (IPCA+7,3%) ou DEB isenta IPCA+8% antes do corte de Selic.";
  else if (/BPAC11/i.test(titulo))
    msg = "→ Sugestão: revisar tese. Se stop, realizar prejuízo compensa IR de RV positiva.";
  else if (/TGRE11/i.test(titulo))
    msg = "→ Sugestão: fundos listados sofrem em ciclo de alta de juros — reavaliar quando Selic começar a cair.";
  else if (/LCD BRDE FEV\/2036/i.test(titulo))
    msg = "→ Ver simulador em Plano → Saída secundário.";
  else if (/LCI XP/i.test(titulo))
    msg = "→ Sugestão: começar a mapear IPCA+8%+ ou pré 14%+ a partir de nov/2026.";
  else if (/LCA Bocom/i.test(titulo))
    msg = "→ Ação: checar rating (Fitch/Moody's) do Banco Bocom BBM antes do próximo aporte.";
  else if (/Proventos/i.test(titulo))
    msg = "→ Provisionar para reinvestimento automático — evita caixa parado.";

  if (!msg) return null;
  return (
    <div
      style={{
        fontSize: 12,
        color: cor === "g" ? "var(--success)" : "var(--accent)",
        marginTop: 4,
        fontStyle: "italic",
      }}
    >
      {msg}
    </div>
  );
}
