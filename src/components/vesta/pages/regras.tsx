import { getUser } from "@/data/vesta-users";
import type { ProfileId } from "@/lib/profile-derive";

type Regra = {
  emoji: string;
  titulo: string;
  regra: string;
  porque: string;
  quando: string;
  severidade: "critica" | "alta" | "media";
};

const REGRAS: Regra[] = [
  {
    emoji: "🔒",
    titulo: "Não mexer nas debêntures J&F (+15,15% isento)",
    regra: "Segurar até fev/2028. Não vender no secundário mesmo com deságio negativo.",
    porque: "Taxa fixa de 15,15% isenta é irreplicável hoje. Qualquer troca destrói valor.",
    quando: "Reavaliar só se J&F entrar em default (spread > 500bps) ou taxa de mercado subir >18%.",
    severidade: "critica",
  },
  {
    emoji: "🔒",
    titulo: "Não mexer na NTN-B 2050 (Paulo)",
    regra: "Manter até vencimento ou até taxa real de mercado passar de 8%.",
    porque: "Compradas em 2021 com IPCA+4,45% e +4,65% — hoje NTN-B 2050 paga ~7,3%. Não desfazer no prejuízo.",
    quando: "Vender só se conseguir NTN-B nova ≥ IPCA+8% E o resgate cobrir IR + custos.",
    severidade: "alta",
  },
  {
    emoji: "🔒",
    titulo: "Não mexer na DEB Jalles (IPCA+8,5% dez/2031)",
    regra: "Segurar até vencimento. Taxa real de 8,5% + isenção IR é excelente.",
    porque: "NTN-B 2031 hoje paga ~7,3% e é tributada. Jalles bate por ~1,5-2 pp reais.",
    quando: "Reavaliar apenas se rating da Jalles cair abaixo de BB-.",
    severidade: "alta",
  },
  {
    emoji: "🔒",
    titulo: "Não mexer nas LCAs SICOOB / Original (92-94% CDI)",
    regra: "Segurar até 2030. Isenção + rating alto justifica taxa relativa.",
    porque: "Reinvestir em pós-fix novo hoje pega no máximo 93% CDI de emissores parecidos.",
    quando: "Vender só se aparecer LCA ≥ 100% CDI de emissor equivalente E o secundário sair sem deságio.",
    severidade: "alta",
  },
  {
    emoji: "🔒",
    titulo: "Não mexer na LCI XP (Cinthia) antes do vencimento",
    regra: "Vence 13/05/2027. Não vender antecipado.",
    porque: "89% CDI isento por ~10 meses é aceitável. Deságio no secundário anula ganho de troca.",
    quando: "Começar a mapear alternativas (IPCA+8%+ ou pré 14%+) a partir de nov/2026.",
    severidade: "media",
  },
  {
    emoji: "⚠️",
    titulo: "Monitorar LCD BRDE FEV/2036 (Cinthia)",
    regra: "Considerar saída no secundário quando Selic estiver precificada em queda mas ainda alta.",
    porque: "10 anos a 92,5% CDI vira <9% quando Selic cair para 9%. IPCA+7,3% de NTN-B 2035 bate.",
    quando: "Usar simulador (Plano → Saída secundário) — vender só com deságio abaixo do ponto de indiferença.",
    severidade: "media",
  },
  {
    emoji: "🚫",
    titulo: "Não aportar mais em fundos listados (TGRE11, XPAG11)",
    regra: "Manter posição atual, mas não aumentar. Ciclo de juros altos pressiona cotação.",
    porque: "TGRE11 já com -11,7% de capital. Fundo listado sofre em Selic alta e demora a recuperar.",
    quando: "Reavaliar aporte só quando Selic entrar em ciclo firme de queda (< 10%).",
    severidade: "media",
  },
  {
    emoji: "🚫",
    titulo: "Não realizar prejuízo em BPAC11 sem tese nova",
    regra: "PM R$86,85 vs mercado ~R$54,48 (-37%). Não vender no pânico.",
    porque: "Realizar prejuízo só faz sentido para (a) compensar IR de RV positiva ou (b) capital melhor alocado.",
    quando: "Se decidir sair: usar o prejuízo para abater IR sobre PSSA3/ITSA4 quando realizar ganho.",
    severidade: "media",
  },
];

const SEV_COLOR: Record<Regra["severidade"], string> = {
  critica: "var(--danger)",
  alta: "var(--warning)",
  media: "var(--muted)",
};
const SEV_BG: Record<Regra["severidade"], string> = {
  critica: "var(--danger-bg)",
  alta: "var(--warning-bg)",
  media: "#F5EEEF",
};

export function RegrasPage({ profileId }: { profileId: ProfileId }) {
  const u = getUser(profileId);

  return (
    <>
      <div className="ph">
        <h1>Regras — o que não mexer</h1>
        <p>
          Compromissos de gestão para {u.nome}. Cada regra tem um "porquê" e um gatilho claro de
          revisão — evita decisão impulsiva quando o mercado sacode.
        </p>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-l">Regras críticas</div>
          <div className="kpi-v bad">{REGRAS.filter((r) => r.severidade === "critica").length}</div>
          <div className="kpi-s">não mexer sob nenhuma hipótese</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Regras altas</div>
          <div className="kpi-v warn">{REGRAS.filter((r) => r.severidade === "alta").length}</div>
          <div className="kpi-s">só quebrar com gatilho explícito</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Regras médias</div>
          <div className="kpi-v">{REGRAS.filter((r) => r.severidade === "media").length}</div>
          <div className="kpi-s">reavaliar em janelas</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Última revisão</div>
          <div className="kpi-v blue">jul/2026</div>
          <div className="kpi-s">reavaliar semestralmente</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {REGRAS.map((r, i) => (
          <div
            key={i}
            className="card"
            style={{ borderLeft: `4px solid ${SEV_COLOR[r.severidade]}` }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{r.emoji}</span>
              <strong style={{ fontSize: 15, fontFamily: "var(--font-elegant)" }}>{r.titulo}</strong>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  padding: "2px 10px",
                  borderRadius: 12,
                  background: SEV_BG[r.severidade],
                  color: SEV_COLOR[r.severidade],
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  fontWeight: 600,
                }}
              >
                {r.severidade}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, fontSize: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>Regra</div>
                <div style={{ color: "var(--text)" }}>{r.regra}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>Por quê</div>
                <div style={{ color: "var(--muted)" }}>{r.porque}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>Gatilho de revisão</div>
                <div style={{ color: "var(--muted)" }}>{r.quando}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
