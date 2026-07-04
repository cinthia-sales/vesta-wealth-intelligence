import { getUser } from "@/data/vesta-users";
import type { ProfileId } from "@/lib/profile-derive";

function fmtRK(v: number) {
  if (v >= 1_000_000) return "R$ " + (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return "R$ " + Math.round(v / 1_000) + "k";
  return "R$ " + Math.round(v).toLocaleString("pt-BR");
}

export function HomePage({ profileId }: { profileId: ProfileId }) {
  const u = getUser(profileId);
  const firstName = u.nome.split(" ")[0];

  return (
    <>
      <div className="ph">
        <h1>Bom dia, Cinthia</h1>
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
              {profileId === "familiar" ? "Resumo familiar ✦" : `Resumo — ${firstName} ✦`}
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

      <div className="g2">
        <div className="card">
          <div className="card-hdr">
            {profileId === "familiar" ? "Alertas recentes — família" : `Alertas recentes — ${firstName}`}
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
