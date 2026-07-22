import { useEffect, useState } from "react";
import { getUser } from "@/data/vesta-users";
import { codigoAtivo } from "@/data/cadastro-ativos";
import type { ProfileId } from "@/lib/profile-derive";

function fmtRK(v: number) {
  if (v >= 1_000_000) return "R$ " + (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return "R$ " + Math.round(v / 1_000) + "k";
  return "R$ " + Math.round(v).toLocaleString("pt-BR");
}

function parseValorBR(v: unknown): number {
  if (typeof v === "number") return v;
  const n = Number(String(v ?? "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const CDI_ANO_ESTIMADO = 14.15; // fallback quando o BCB não responde

/* Pulso do dia: RV ao vivo (brapi) + RF acruada pró-rata (CDI/252) */
function PulsoDoDia({ u }: { u: ReturnType<typeof getUser> }) {
  const [movs, setMovs] = useState<{ ticker: string; valor: number; pct: number }[] | null>(null);
  const [erro, setErro] = useState(false);

  const posicoesRV = (u.rv_ativos ?? [])
    .map((a: any) => ({ ticker: codigoAtivo(String(a.nome ?? "")), valor: parseValorBR(a.v) }))
    .filter((p) => p.ticker && p.valor > 0);

  useEffect(() => {
    if (posicoesRV.length === 0) { setMovs([]); return; }
    // brapi grátis só aceita 1 ticker por chamada — busca em paralelo, tolerando falhas
    const tickers = Array.from(new Set(posicoesRV.map((p) => p.ticker)));
    let cancelado = false;
    Promise.allSettled(
      tickers.map((t) =>
        fetch(`https://brapi.dev/api/quote/${t}`)
          .then((r) => r.json())
          .then((json) => {
            const q = json?.results?.[0];
            return q?.regularMarketChangePercent != null
              ? { ticker: t, pct: q.regularMarketChangePercent as number }
              : null;
          }),
      ),
    ).then((resultados) => {
      if (cancelado) return;
      const porTicker = new Map<string, number>();
      for (const r of resultados) {
        if (r.status === "fulfilled" && r.value) porTicker.set(r.value.ticker, r.value.pct);
      }
      if (porTicker.size === 0) setErro(true);
      setMovs(
        posicoesRV
          .filter((p) => porTicker.has(p.ticker))
          .map((p) => ({ ticker: p.ticker, valor: p.valor, pct: porTicker.get(p.ticker)! })),
      );
    });
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [u.total]);

  const rfDia = u.rf * (Math.pow(1 + CDI_ANO_ESTIMADO / 100, 1 / 252) - 1);
  if (movs === null) return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-hdr">Pulso do dia <span>buscando cotações…</span></div>
    </div>
  );

  const rvDia = movs.reduce((s, m) => s + (m.valor * m.pct) / 100, 0);
  const totalDia = rvDia + rfDia;
  const pctDia = u.total > 0 ? (totalDia / u.total) * 100 : 0;
  const cor = totalDia >= 0 ? "var(--success, #4E7A5C)" : "var(--danger, #C0392B)";
  const sinal = totalDia >= 0 ? "+" : "−";
  const fmt = (n: number) =>
    "R$ " + Math.abs(Math.round(n)).toLocaleString("pt-BR");
  const topMovers = [...movs].sort((a, b) => Math.abs(b.valor * b.pct) - Math.abs(a.valor * a.pct)).slice(0, 3);

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-hdr">
        Pulso do dia <span>{erro ? "bolsa indisponível · só RF estimada" : "RV ao vivo (B3) · RF pró-rata CDI"}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 22, alignItems: "baseline" }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: cor }}>
            {sinal}{fmt(totalDia)}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            hoje · {sinal}{Math.abs(pctDia).toFixed(2)}% do patrimônio
          </div>
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
          <div>Renda variável: <b style={{ color: rvDia >= 0 ? "var(--success, #4E7A5C)" : "var(--danger, #C0392B)" }}>{rvDia >= 0 ? "+" : "−"}{fmt(rvDia)}</b></div>
          <div>Renda fixa (estimada): <b>+{fmt(rfDia)}</b> <span style={{ fontSize: 11 }}>({CDI_ANO_ESTIMADO}% a.a. ÷ 252)</span></div>
        </div>
        {topMovers.length > 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>
            {topMovers.map((m) => (
              <div key={m.ticker}>
                <b>{m.ticker}</b>: {m.pct >= 0 ? "+" : ""}{m.pct.toFixed(2)}% ({m.pct >= 0 ? "+" : "−"}{fmt((m.valor * m.pct) / 100)})
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function saudacaoPorHora(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite";
}

export function HomePage({ profileId, overrideName, loggedName }: { profileId: ProfileId; overrideName?: string; loggedName?: string }) {
  const u = getUser(profileId);
  // Saudação sempre para quem está logado, nunca para o nome da visão/consolidado
  const firstName = (loggedName ?? overrideName ?? u.nome).split(" ")[0];
  const memberName = (overrideName ?? u.nome).split(" ")[0];
  const saud = saudacaoPorHora();
  const hasPingados =
    /pingado|rendimento/i.test(u.kpi4_label) ||
    /pagadores|provento/i.test(u.kpi4_sub);

  if (u.total <= 0) {
    const consolidated = profileId === "familiar" || profileId.startsWith("domus:");
    return (
      <>
        <div className="ph">
          <h1>{consolidated ? `Visão geral · ${overrideName ?? u.nome}` : `${saud}, ${firstName}`}</h1>
          <p>
            {consolidated
              ? "O consolidado será formado automaticamente pelas carteiras deste Domus."
              : "Esta carteira ainda não possui uma posição importada."}
          </p>
        </div>
        <div className="kpi-row">
          <div className="kpi"><div className="kpi-l">Patrimônio total</div><div className="kpi-v">R$ 0</div><div className="kpi-s">aguardando posição</div></div>
          <div className="kpi"><div className="kpi-l">Renda fixa</div><div className="kpi-v blue">R$ 0</div><div className="kpi-s">sem dados</div></div>
          <div className="kpi"><div className="kpi-l">Renda variável</div><div className="kpi-v">R$ 0</div><div className="kpi-s">sem dados</div></div>
          <div className="kpi"><div className="kpi-l">Status</div><div className="kpi-v blue">Em branco</div><div className="kpi-s">nenhum arquivo aplicado</div></div>
        </div>
        <div className="card empty-overview-card">
          <div className="card-hdr">Primeira posição</div>
          <p>
            {consolidated
              ? "Importe a posição mensal nas carteiras de cada pessoa. Esta visão será atualizada sem uma importação própria."
              : "Quando quiser preencher esta carteira, use “Importar posição mensal” no menu superior."}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="ph">
        <h1>{saud}, {firstName}</h1>
        <p>{u.saudacao}</p>
      </div>


      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-l">{profileId === "familiar" ? "Patrimônio familiar" : "Patrimônio total"}</div>
          <div className="kpi-v">{fmtRK(u.total)}</div>
          <div className="kpi-s">posição atualizada</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Renda fixa</div>
          <div className="kpi-v blue">{fmtRK(u.rf)}</div>
          <div className="kpi-s">{u.rf_pct.toFixed(1)}% da carteira</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Renda variável</div>
          <div className="kpi-v">{u.rv > 0 ? fmtRK(u.rv) : "—"}</div>
          <div className="kpi-s">{u.rv > 0 ? u.rv_pct.toFixed(1) + "% da carteira" : "sem renda variável"}</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">{u.kpi4_label}</div>
          <div className="kpi-v blue">{u.kpi4_val}</div>
          <div className="kpi-s">{u.kpi4_sub}</div>
        </div>
      </div>

      <PulsoDoDia u={u} />

      <div className="g32">
        <div className="card">
          <div className="card-hdr">
            Alocação atual <span>por estratégia</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "center" }}>
            <div className="donut-wrap">
              <DonutSvg data={u.donut_data} colors={u.donut_colors} />
              <div className="donut-ctr">
                <div className="donut-val">{fmtRK(u.total)}</div>
                <div className="donut-lbl">total</div>
              </div>
            </div>
            <div>
              <div className="legend" style={{ flexDirection: "column", gap: 6 }}>
                {u.donut_labels.map((l, i) => (
                  <div className="leg" key={l}>
                    <div className="leg-sq" style={{ background: u.donut_colors[i] }} />
                    {l} — {fmtRK(u.donut_data[i])}
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontSize: 12,
                  padding: "10px 12px",
                  background: "var(--success-bg)",
                  borderRadius: 8,
                  color: "var(--success)",
                  lineHeight: 1.5,
                }}
              >
                <strong>{u.rf_pct.toFixed(1)}% em RF</strong>
                <br />
                {profileId === "cinthia"
                  ? "Carteira 100% renda fixa"
                  : "Meta: manter até mai/2028 sem mexer nos intocáveis"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ flex: 1 }}>
            <div className="card-hdr">
              {profileId === "familiar" ? "Resumo familiar" : `Carteira de ${memberName}`}
            </div>
            {u.resumo.map((r) => (
              <div className="aitem" key={r.nome}>
                <div className={"dot d" + r.dot} />
                <div>
                  <div className="aitem-name">{r.nome}</div>
                  <div className="aitem-det">{r.det}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {hasPingados && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-hdr">
            Pingados — carteira de {memberName}
            <span>{u.kpi4_sub}</span>
          </div>
          <div className="aitem">
            <div className="dot dg" />
            <div>
              <div className="aitem-name">{u.kpi4_val} recorrentes</div>
              <div className="aitem-det">
                Rendimentos/proventos mapeados na posição importada. Ver detalhe em Rendimentos recorrentes.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="g2">
        <div className="card">
          <div className="card-hdr">
            {profileId === "familiar" ? "Alertas recentes — família" : `Alertas recentes — carteira de ${memberName}`}
          </div>
          {u.alertas_list.slice(0, 4).map((a) => (
            <div className="aitem" key={a.titulo}>
              <div className={"dot d" + a.cor} />
              <div>
                <div className="aitem-name">{a.titulo}</div>
                <div className="aitem-det">{a.det}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-hdr">
            {profileId === "familiar" ? "Próximos vencimentos — família 📅" : "Próximos vencimentos 📅"}
          </div>
          {u.vencimentos.map((v) => (
            <div className="vitem" key={v.nome}>
              <div className="vitem-icon" style={{ background: v.bg }}>{v.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="vitem-name">{v.nome}</div>
                <div className="vitem-det">{v.det}</div>
              </div>
              <span className={"sb " + v.bc}>{v.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function DonutSvg({ data, colors }: { data: number[]; colors: string[] }) {
  const total = data.reduce((s, v) => s + v, 0) || 1;
  const R = 60;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg viewBox="0 0 160 160" style={{ width: "100%", height: "100%" }}>
      <g transform="translate(80 80) rotate(-90)">
        {data.map((v, i) => {
          const len = (v / total) * C;
          const el = (
            <circle
              key={i}
              r={R}
              fill="none"
              stroke={colors[i]}
              strokeWidth={22}
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </g>
    </svg>
  );
}

