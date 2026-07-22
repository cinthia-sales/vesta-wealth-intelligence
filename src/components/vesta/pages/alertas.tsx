import { useMemo, useState } from "react";

import { getUser } from "@/data/vesta-users";
import type { ProfileId } from "@/lib/profile-derive";

type Sev = "r" | "w" | "g";

const SEV_LABEL: Record<Sev, string> = { r: "urgente", w: "atenção", g: "positivo" };
const SEV_CLASS: Record<Sev, string> = { r: "sb-r", w: "sb-w", g: "sb-g" };
const DOT_CLASS: Record<Sev, string> = { r: "dr", w: "dw", g: "dg" };

function badgeDotClass(bc: string) {
  if (bc.includes("sb-r")) return "dr";
  if (bc.includes("sb-g") || bc.includes("sb-ok")) return "dg";
  return "dw";
}

function daysUntil(dmy: string) {
  const [d, m, y] = dmy.split("/").map(Number);
  if (!d || !m || !y) return null;
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function parseMoney(value: string) {
  const n = Number(value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function splitReferencia(pm: string) {
  const normalized = pm.replace(/\s*[·-]\s*Importado XP\s*/gi, "").replace(/\s*Importado XP\s*/gi, "").replace(/\s+/g, " ").trim();
  const pmMatch = normalized.match(/PM\s*(R\$\s*[\d.,]+)/i) ?? normalized.match(/^(R\$\s*[\d.,]+)/i);
  const cotMatch = normalized.match(/Cot\.?\s*(R\$\s*[\d.,]+)/i);
  return { pm: pmMatch?.[1] ?? "", cotacao: cotMatch?.[1] ?? "" };
}

export function AlertasPage({ profileId }: { profileId: ProfileId }) {
  const u = getUser(profileId);
  const [filtro, setFiltro] = useState<"todos" | Sev>("todos");

  const alertas = useMemo(() => {
    const base = u.alertas_list.map((a) => {
      const match = a.det.match(/(\d{2}\/\d{2}\/\d{4})/);
      const dias = match ? daysUntil(match[1]) : null;
      return { ...a, dias };
    });
    const rvAlerts = (u.rv_ativos ?? []).flatMap((a) => {
      const ref = splitReferencia(a.pm);
      const pm = parseMoney(ref.pm);
      const cotacao = parseMoney(ref.cotacao);
      if (pm === null || cotacao === null || cotacao >= pm) return [];
      const queda = ((cotacao / pm) - 1) * 100;
      return [{
        cor: "r" as const,
        titulo: `${a.n} abaixo do PM`,
        det: `PM ${ref.pm} · cota atual ${ref.cotacao} · diferença ${queda.toFixed(1).replace(".", ",")}% · revisar tese de RV/listado.`,
        dias: null,
      }];
    });
    // Veredito linha dura: em toda carteira com RV, soma o estrago em reais.
    // Regra da casa: RV que não bate o CDI é passivo disfarçado de investimento.
    const rvVeredito = (() => {
      if (!u.rv || u.rv <= 0) return [];
      let investido = 0;
      let atual = 0;
      let abaixoPM = 0;
      let comDados = 0;
      for (const a of u.rv_ativos ?? []) {
        const valorAtual = parseMoney(String(a.v));
        if (valorAtual === null) continue;
        const qtdMatch = String(a.pm ?? "").match(/([\d.]+)\s*(ações|cotas)/i);
        const pmMatch = String(a.pm ?? "").match(/R\$\s?([\d.,]+)/);
        const aplicadoMatch = String(a.pm ?? "").match(/Aplicado\s*R\$\s?([\d.,]+)/i);
        let aporte: number | null = null;
        if (aplicadoMatch) aporte = parseMoney(aplicadoMatch[1]);
        else if (qtdMatch && pmMatch) {
          const qtd = Number(qtdMatch[1].replace(/\./g, ""));
          const pm = parseMoney(pmMatch[1]);
          if (pm !== null && qtd > 0) aporte = pm * qtd;
        }
        if (aporte === null) continue;
        comDados++;
        investido += aporte;
        atual += valorAtual;
        if (valorAtual < aporte) abaixoPM += aporte - valorAtual;
      }
      if (comDados === 0) return [];
      const delta = atual - investido;
      const fmtR = (n: number) => "R$ " + Math.abs(Math.round(n)).toLocaleString("pt-BR");
      const pctCart = u.total > 0 ? ((u.rv / u.total) * 100).toFixed(0) : "?";
      return [{
        cor: (delta < 0 ? "r" : "w") as Sev,
        titulo: `Renda variável — veredito linha dura`,
        det: `${fmtR(u.rv)} em RV (${pctCart}% da carteira) · capital ${delta >= 0 ? "acima" : "ABAIXO"} do aporte em ${fmtR(delta)} · ${fmtR(abaixoPM)} presos em posições no prejuízo. Dividendo não compensa capital afundado; RV que perde do CDI é passivo. Regra da casa: 2 anos abaixo do CDI = migrar.`,
        dias: null,
      }];
    })();
    return [...rvVeredito, ...base, ...rvAlerts];
  }, [u]);

  const filtered = filtro === "todos" ? alertas : alertas.filter((a) => a.cor === filtro);
  const counts = {
    r: alertas.filter((a) => a.cor === "r").length,
    w: alertas.filter((a) => a.cor === "w").length,
    g: alertas.filter((a) => a.cor === "g").length,
  };
  const groups: Array<{ id: Sev; title: string; hint: string }> = [
    { id: "r", title: "Urgentes", hint: "decisão nas próximas semanas" },
    { id: "w", title: "Atenção", hint: "monitorar / preparar" },
    { id: "g", title: "Positivos", hint: "ganhos garantidos / provisionados" },
  ];
  const visibleGroups = groups.filter((g) => counts[g.id] > 0);
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
        <p>Situações da carteira que exigem decisão, separadas por severidade.</p>
      </div>

      <div className="card alert-summary-card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Resumo dos alertas <span>{alertas.length} alerta(s)</span>
        </div>
        <div className="alert-legend">
          <span>
            <span className="dot dr" /> vermelho: decidir
          </span>
          <span>
            <span className="dot dw" /> laranja: monitorar
          </span>
          <span>
            <span className="dot dg" /> verde: ganho/travado
          </span>
        </div>
        {visibleGroups.length === 0 ? (
          <div className="aitem">
            <div className="dot dg" />
            <div>
              <div className="aitem-name">Sem alertas ativos</div>
              <div className="aitem-det">Nenhuma situação relevante apareceu para esta carteira.</div>
            </div>
          </div>
        ) : (
          visibleGroups.map((g) => (
            <div className={"alert-severity-card " + g.id} key={g.id}>
              <div className={"dot " + DOT_CLASS[g.id]} />
              <div>
                <div className="aitem-name">
                  {g.title}: {counts[g.id]}
                </div>
                <div className="aitem-det">{g.hint}</div>
              </div>
            </div>
          ))
        )}
        {proximosVenc[0] && (
          <div className="alert-severity-card w">
            <div className="dot dw" />
            <div>
              <div className="aitem-name">Próximo vencimento</div>
              <div className="aitem-det">
                {proximosVenc[0].nome} ·{" "}
                {proximosVenc[0].det.match(/(\d{2}\/\d{2}\/\d{4})/)?.[1] ?? "data a confirmar"}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Feed de alertas <span>{filtered.length} item(s)</span>
        </div>
        <div className="filter-row">
          {fb("todos", "Todos", alertas.length)}
          {fb("r", "Urgentes", counts.r)}
          {fb("w", "Atenção", counts.w)}
          {counts.g > 0 && fb("g", "Positivos", counts.g)}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            Nenhum alerta nesse filtro.
          </div>
        )}

        {filtered.map((a, i) => (
          <div className={"alert-full " + a.cor} key={i}>
            <div className="alert-full-grid">
              <div className={"dot " + DOT_CLASS[a.cor]} />
              <div style={{ flex: 1, minWidth: 0 }}>
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
            </div>
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
                    <span className={"dot " + badgeDotClass(v.bc)} />
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
  let msg: string | null = null;
  if (/NTN-B AGO\/2026/i.test(titulo))
    msg = "Sugestão: travar em NTN-B 2035 (IPCA+7,3%) ou debênture isenta IPCA+8% antes do corte de Selic.";
  else if (/BPAC11/i.test(titulo))
    msg = "Sugestão: revisar tese. Se houver stop, realizar prejuízo pode compensar IR de RV positiva.";
  else if (/TGRE11/i.test(titulo))
    msg = "Sugestão: fundos listados sofrem em ciclo de juros altos; reavaliar quando a Selic começar a cair.";
  else if (/LCD BRDE FEV\/2036/i.test(titulo))
    msg = "Ver simulador em Plano / Saída secundário.";
  else if (/LCI XP/i.test(titulo))
    msg = "Sugestão: começar a mapear IPCA+8% ou pré 14%+ a partir de nov/2026.";
  else if (/LCA Bocom/i.test(titulo))
    msg = "Ação: checar rating do Banco Bocom BBM antes do próximo aporte.";
  else if (/Proventos|Pingados/i.test(titulo))
    msg = "Provisionar para reinvestimento automático e evitar caixa parado.";

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
