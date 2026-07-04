import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ProfileSelector, VestaShell } from "@/components/vesta/shell";
import type { ProfileId } from "@/lib/profile-derive";

export const Route = createFileRoute("/")({
  component: VestaApp,
});

function VestaApp() {
  const [profile, setProfile] = useState<ProfileId | null>(null);

  if (!profile) return <ProfileSelector onSelect={setProfile} />;
  return (
    <VestaShell
      profileId={profile}
      onChangeProfile={setProfile}
      onSwitchProfile={() => setProfile(null)}
    >
      <HomePage />
    </VestaShell>
  );
}

/* ============================================================
   HomePage — replica exata de #page-home do vesta.html
   ============================================================ */
function HomePage() {
  return (
    <>
      <div className="ph">
        <h1>Bom dia, Cinthia</h1>
        <p>Acompanhe e cuide da saúde financeira da família.</p>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-l">Patrimônio total</div>
          <div className="kpi-v">R$ 648.476</div>
          <div className="kpi-s">posição 02/07/2026</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Renda fixa</div>
          <div className="kpi-v blue">R$ 532.076</div>
          <div className="kpi-s">82.1% da carteira</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Renda variável</div>
          <div className="kpi-v">R$ 116.399</div>
          <div className="kpi-s">17.9% da carteira</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Breakeven do plano</div>
          <div className="kpi-v blue">mai/2028</div>
          <div className="kpi-s">22 meses · +R$ 692/mês</div>
        </div>
      </div>

      <div className="g32">
        <div className="card">
          <div className="card-hdr">
            Alocação atual <span>por estratégia</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "center" }}>
            <div className="donut-wrap">
              <DonutSvg />
              <div className="donut-ctr">
                <div className="donut-val">R$ 648k</div>
                <div className="donut-lbl">total</div>
              </div>
            </div>
            <div>
              <div className="legend" style={{ flexDirection: "column", gap: 6 }}>
                <div className="leg"><div className="leg-sq" style={{ background: "#C47E3A" }} />LCA pós-fix. isento — R$142k</div>
                <div className="leg"><div className="leg-sq" style={{ background: "#4A7C59" }} />Inflação IPCA+ — R$245k</div>
                <div className="leg"><div className="leg-sq" style={{ background: "#8B7355" }} />Prefixado isento — R$95k</div>
                <div className="leg"><div className="leg-sq" style={{ background: "#f59e0b" }} />XPAG11 agro — R$61k</div>
                <div className="leg"><div className="leg-sq" style={{ background: "#A89880" }} />Renda variável — R$116k</div>
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
                <strong>83,6% em RF</strong>
                <br />
                Meta: manter até mai/2028 sem mexer nos intocáveis
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ flex: 1 }}>
            <div className="card-hdr">Resumo do plano</div>
            <div className="aitem">
              <div className="dot dw" />
              <div>
                <div className="aitem-name">Reestruturação jun/26</div>
                <div className="aitem-det">Custo R$14.698 · ganho +R$692/mês · recupera mai/2028</div>
              </div>
            </div>
            <div className="aitem">
              <div className="dot dg" />
              <div>
                <div className="aitem-name">Taxa média subiu de 11,81% → 14,86%</div>
                <div className="aitem-det">+3,05%/ano · R$285/mês vem das debêntures novas</div>
              </div>
            </div>
            <div className="aitem">
              <div className="dot dg" />
              <div>
                <div className="aitem-name">4 blocos intocáveis</div>
                <div className="aitem-det">J&F · Jalles · LCAs · NTN-B 2050 — não tocar antes de mai/2028</div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-hdr">Progresso do breakeven</div>
            {[
              { l: "hoje (~1 mês)", r: "5%", w: 5, cls: "blue" },
              { l: "dez/2026 (6 m)", r: "28%", w: 28 },
              { l: "jun/2027 (12 m)", r: "57%", w: 57 },
              { l: "mai/2028 — meta ✓", r: "100%", w: 100, done: true },
            ].map((p) => (
              <div className="prog" key={p.l}>
                <div className="prog-hdr">
                  <span>{p.l}</span>
                  <span className={p.done ? "good" : p.cls}>{p.r}</span>
                </div>
                <div className="prog-bar">
                  <div
                    className="prog-fill"
                    style={{ width: `${p.w}%`, ...(p.done ? { background: "var(--success)" } : {}) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-hdr">Alertas recentes</div>
          {[
            { d: "dr", n: "NTN-B AGO/2026 — vence em 45 dias", t: "R$96.511 liberam em 15/08. Decidir destino AGORA para não ficar parado em conta." },
            { d: "dw", n: "LCD BRDE — confirmar taxa na XP", t: "R$57.618 investidos em 29/06 não apareceram na posição. Checar." },
            { d: "dw", n: "BPAC11 — -37,27% sobre preço médio", t: "Revisar tese de investimento ou definir stop loss." },
            { d: "dg", n: "Come-cotas XPAG11 em nov/2026", t: "Verificar se ainda compensa vs LCA direta antes de novembro." },
          ].map((a) => (
            <div className="aitem" key={a.n}>
              <div className={"dot " + a.d} />
              <div>
                <div className="aitem-name">{a.n}</div>
                <div className="aitem-det">{a.t}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-hdr">Próximos vencimentos</div>
          {[
            { i: "🔴", bg: "var(--danger-bg)", n: "NTN-B AGO/2026", d: "R$96.511 · 15/08/2026 · 45 dias", b: "sb-r", bl: "urgente" },
            { i: "🔒", bg: "rgba(79,142,247,.1)", n: "DEB J&F FEV/2028", d: "R$94.830 · 21/02/2028 · 15,15% isento", b: "sb-a", bl: "intocável" },
            { i: "🔒", bg: "rgba(79,142,247,.1)", n: "LCA ORIGINAL DEZ/2028", d: "R$26.700 · 18/12/2028 · 92,5% CDI", b: "sb-a", bl: "intocável" },
            { i: "🔒", bg: "rgba(79,142,247,.1)", n: "LCAs SICOOB 2030 (×4)", d: "R$105.474 · mar–mai/2030 · 92% CDI", b: "sb-a", bl: "intocável" },
            { i: "📅", bg: "var(--success-bg)", n: "DEB JALLES DEZ/2031", d: "R$70.642 · 15/12/2031 · IPCA+8,5%", b: "sb-a", bl: "intocável" },
          ].map((v) => (
            <div className="vitem" key={v.n}>
              <div className="vitem-icon" style={{ background: v.bg }}>{v.i}</div>
              <div style={{ flex: 1 }}>
                <div className="vitem-name">{v.n}</div>
                <div className="vitem-det">{v.d}</div>
              </div>
              <span className={"sb " + v.b}>{v.bl}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* Donut SVG estático (mesma proporção do canvas do HTML). */
function DonutSvg() {
  const segs = [
    { v: 20, c: "#C47E3A" },
    { v: 34, c: "#4A7C59" },
    { v: 13, c: "#8B7355" },
    { v: 16, c: "#f59e0b" },
    { v: 17, c: "#A89880" },
  ];
  const R = 60;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg viewBox="0 0 160 160" style={{ width: "100%", height: "100%" }}>
      <g transform="translate(80 80) rotate(-90)">
        {segs.map((s, i) => {
          const len = (s.v / 100) * C;
          const el = (
            <circle
              key={i}
              r={R}
              fill="none"
              stroke={s.c}
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
