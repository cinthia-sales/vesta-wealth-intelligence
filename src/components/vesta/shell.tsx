import { type ReactElement, type ReactNode, useEffect, useState } from "react";

import { HomePage } from "@/components/vesta/pages/home";
import { PosicaoPage } from "@/components/vesta/pages/posicao";
import { BreakevenPage } from "@/components/vesta/pages/breakeven";
import { EquivPage } from "@/components/vesta/pages/equiv";
import { ValidadorPage } from "@/components/vesta/pages/validador";
import { ProjecaoPage } from "@/components/vesta/pages/projecao";
import { SecundarioPage } from "@/components/vesta/pages/secundario";
import { AlertasPage } from "@/components/vesta/pages/alertas";
import { RegrasPage } from "@/components/vesta/pages/regras";
import { UploadPage } from "@/components/vesta/pages/upload";
import { DriversPage } from "@/components/vesta/pages/drivers";
import { AportePage } from "@/components/vesta/pages/aporte";
import { RendimentosPage } from "@/components/vesta/pages/rendimentos";
import { DomusPage } from "@/components/vesta/pages/domus";

import type { ProfileId } from "@/lib/profile-derive";
import { getUser } from "@/data/vesta-users";
import { getPersonaInfo, type PersonaId, type ScopeMap } from "@/state/session";

/* ============================================================
   ProfileSelector — replica exata de #profile-screen do vesta.html
   ============================================================ */
export type ExtraPersona = {
  id: string;
  papel: string;
  profile_id: string;
  profile?: { nome?: string | null; email?: string | null } | null;
  domus?: { nome?: string | null } | null;
};

export function ProfileSelector({
  onSelect,
  allowed,
  loggedAs,
  onLogout,
  extras = [],
  groupByDomus = false,
}: {
  onSelect: (id: ProfileId) => void;
  allowed?: ProfileId[];
  loggedAs?: PersonaId;
  onLogout?: () => void;
  extras?: ExtraPersona[];
  groupByDomus?: boolean;
}) {
  const canSee = (id: ProfileId) => !allowed || allowed.includes(id);
  const [waiting, setWaiting] = useState<ExtraPersona | null>(null);

  const MALTA_FURTADO = "Domus Malta Furtado";
  const hardcodedEmails = new Set(["cinthiavr@yahoo.com.br", "phfurtadovr@yahoo.com.br"]);

  const extraCards = extras.filter((e) => {
    const profileId = `member:${e.profile_id}` as ProfileId;
    const loggedPersona = loggedAs ? getPersonaInfo(loggedAs) : null;
    return (
      !hardcodedEmails.has((e.profile?.email ?? "").toLowerCase()) &&
      (loggedPersona?.role === "vesta" || canSee(profileId))
    );
  });

  // Para groupByDomus: agrupa extras por domus.nome excluindo Malta Furtado
  const extrasByDomus = new Map<string, ExtraPersona[]>();
  if (groupByDomus) {
    for (const e of extraCards) {
      const key = e.domus?.nome ?? "Sem Domus";
      if (key === MALTA_FURTADO) continue; // esses já aparecem como hardcoded
      if (!extrasByDomus.has(key)) extrasByDomus.set(key, []);
      extrasByDomus.get(key)!.push(e);
    }
  }

  const hasMaltaFurtadoCards =
    canSee("familiar") || canSee("cinthia") || canSee("paulo");

  function ExtraCard({ e }: { e: ExtraPersona }) {
    const nome = e.profile?.nome ?? e.profile?.email ?? "Sem nome";
    const inicial = nome.charAt(0).toUpperCase();
    const primeiroNome = nome.split(" ")[0]?.toUpperCase() ?? nome.toUpperCase();
    return (
      <div
        key={e.id}
        className="ps-card ps-card-waiting"
        onClick={() => onSelect(`member:${e.profile_id}` as ProfileId)}
      >
        <div
          className="ps-avatar"
          style={{
            background: "rgba(120,110,95,.10)",
            color: "var(--muted)",
            border: "1px dashed rgba(120,110,95,.35)",
          }}
        >
          {inicial}
        </div>
        <div>
          <div className="ps-card-name">
            {primeiroNome}
            <br />NOVUS
          </div>
          <div className="ps-card-desc" style={{ margin: "6px 0 10px" }}>
            {e.domus?.nome ?? "Domus"}
            <br />visão individual
            <br />&nbsp;
          </div>
          <div
            className="ps-card-badge"
            style={{ background: "rgba(120,110,95,.14)", color: "var(--muted)" }}
          >
            Aguardando<br />dados XP
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="profile-screen">
      <div className="ps-vesta">✦ Vesta ✦</div>
      <div className="ps-title">Guardiã do Patrimônio</div>
      <div className="ps-subtitle">
        {loggedAs
          ? `Entrou como ${getPersonaInfo(loggedAs).name} · selecione a visão`
          : "Selecione o perfil de acesso"}
      </div>

      {groupByDomus ? (
        /* Vesta Soberana: cards agrupados por Domus */
        <>
          {hasMaltaFurtadoCards && (
            <div style={{ width: "100%" }}>
              <div className="ps-domus-header">DOMUS MALTA FURTADO</div>
              <div className="ps-profiles">
                {canSee("familiar") && (
                  <div className="ps-card" onClick={() => onSelect("familiar")}>
                    <div className="ps-avatar ps-av-fam" style={{ fontSize: 20 }}>🏛</div>
                    <div>
                      <div className="ps-card-name">FAMILIAR DOMUS</div>
                      <div className="ps-card-desc" style={{ margin: "6px 0 10px" }}>
                        Visão consolidada das carteiras e todas as ferramentas
                      </div>
                      <div className="ps-card-badge ps-badge-fam">Acesso total · Vestæ Tantum</div>
                    </div>
                  </div>
                )}
                {canSee("cinthia") && (
                  <div className="ps-card" onClick={() => onSelect("cinthia")}>
                    <div className="ps-avatar ps-av-cinthia">C</div>
                    <div>
                      <div className="ps-card-name">CÍNTHIA&nbsp;VESTA</div>
                      <div className="ps-card-desc" style={{ margin: "6px 0 10px" }}>
                        Carteira XP 6414212<br />visão individual<br />&nbsp;
                      </div>
                      <div className="ps-card-badge ps-badge-ind">Individual&nbsp;Infinitus</div>
                    </div>
                  </div>
                )}
                {canSee("paulo") && (
                  <div className="ps-card" onClick={() => onSelect("paulo")}>
                    <div className="ps-avatar ps-av-paulo">P</div>
                    <div>
                      <div className="ps-card-name">PAULO EFFLUXUS</div>
                      <div className="ps-card-desc" style={{ margin: "6px 0 10px" }}>
                        Carteira XP 5296823<br />visão individual<br />&nbsp;
                      </div>
                      <div className="ps-card-badge ps-badge-ind">Individual Restrictus</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {Array.from(extrasByDomus.entries()).map(([domusNome, members]) => (
            <div key={domusNome} style={{ width: "100%" }}>
              <div className="ps-domus-header">
                {domusNome.replace(/^fam[íi]lia\s+/i, "Domus ").toUpperCase()}
              </div>
              <div className="ps-profiles">
                {members.map((e) => <ExtraCard key={e.id} e={e} />)}
              </div>
            </div>
          ))}
        </>
      ) : (
        /* Layout plano: Membro ou Semi-Vesta */
        <div className="ps-profiles">
          {canSee("familiar") && (
            <div className="ps-card" onClick={() => onSelect("familiar")}>
              <div className="ps-avatar ps-av-fam" style={{ fontSize: 20 }}>🏛</div>
              <div>
                <div className="ps-card-name">FAMILIAR DOMUS</div>
                <div className="ps-card-desc" style={{ margin: "6px 0 10px" }}>
                  Visão consolidada&nbsp;das carteiras&nbsp;{"\n"}e todas as ferramentas
                </div>
                <div className="ps-card-badge ps-badge-fam">Acesso total -&nbsp;Vestæ Tantum</div>
              </div>
            </div>
          )}
          {canSee("cinthia") && (
            <div className="ps-card" onClick={() => onSelect("cinthia")}>
              <div className="ps-avatar ps-av-cinthia">C</div>
              <div>
                <div className="ps-card-name">CÍNTHIA&nbsp;VESTA</div>
                <div className="ps-card-desc" style={{ margin: "6px 0 10px" }}>
                  Carteira XP 6414212<br />visão individual<br />&nbsp;
                </div>
                <div className="ps-card-badge ps-badge-ind">Individual&nbsp;Infinitus</div>
              </div>
            </div>
          )}
          {canSee("paulo") && (
            <div className="ps-card" onClick={() => onSelect("paulo")}>
              <div className="ps-avatar ps-av-paulo">P</div>
              <div>
                <div className="ps-card-name">PAULO EFFLUXUS</div>
                <div className="ps-card-desc" style={{ margin: "6px 0 10px" }}>
                  Carteira XP 5296823<br />visão individual<br />&nbsp;
                </div>
                <div className="ps-card-badge ps-badge-ind">Individual Restrictus</div>
              </div>
            </div>
          )}
          {extraCards.map((e) => <ExtraCard key={e.id} e={e} />)}
        </div>
      )}

      <div className="ps-ornament">
        Domus Malta Furtado · 2026
        {onLogout && (
          <>
            {" · "}
            <a
              onClick={onLogout}
              style={{ cursor: "pointer", textDecoration: "underline", color: "var(--accent)" }}
            >
              sair
            </a>
          </>
        )}
      </div>

      {waiting && (
        <div className="domus-approved-overlay" onClick={() => setWaiting(null)}>
          <div className="domus-approved-card" onClick={(ev) => ev.stopPropagation()}>
            <p className="public-domus-kicker">Persona sem dados</p>
            <h3>{waiting.profile?.nome ?? "Novo membro"}</h3>
            <p style={{ lineHeight: 1.6 }}>
              A Vesta já aprovou o acesso, mas ainda não subimos os documentos XP dessa persona.
              Quando o extrato for carregado, a carteira dela aparece aqui como as outras.
            </p>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              {waiting.profile?.email} · {waiting.domus?.nome ?? "Domus"} · {waiting.papel}
            </p>
            <button onClick={() => setWaiting(null)}>Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Nav items — SVGs replicados do vesta.html
   ============================================================ */
const NAV_ICONS: Record<string, ReactElement> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  posicao: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  alertas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  equiv: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  validador: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3m8 0h3a2 2 0 002-2v-3" />
    </svg>
  ),
  breakeven: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  regras: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  drivers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  ),
  aporte: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  rendimentos: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  start: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 12h18" />
      <path d="M3 12l6-6" />
      <path d="M3 12l6 6" />
    </svg>
  ),
  consolidado: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
      <circle cx="12" cy="7" r="1" fill="currentColor" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
};

type PageKey =
  | "home"
  | "posicao"
  | "alertas"
  | "equiv"
  | "validador"
  | "breakeven"
  | "projecao"
  | "secundario"
  | "regras"
  | "upload"
  | "drivers"
  | "aporte"
  | "rendimentos"
  | "domus";

const PROFILE_META: Record<"familiar" | "cinthia" | "paulo", { name: string; sub: string; avatarBg: string; avatarColor: string; content: ReactNode }> = {
  familiar: {
    name: "FAMILIAR - DOMUS",
    sub: "Todas as carteiras",
    avatarBg: "rgba(161,29,62,.10)",
    avatarColor: "var(--accent)",
    content: <span style={{ fontSize: 14 }}>🏛</span>,
  },
  cinthia: {
    name: "CÍNTHIA VESTA",
    sub: "XP 6414212",
    avatarBg: "rgba(161,29,62,.08)",
    avatarColor: "var(--accent)",
    content: <>C</>,
  },
  paulo: {
    name: "PAULO EFFLUXUS",
    sub: "XP 5296823",
    avatarBg: "rgba(161,29,62,.08)",
    avatarColor: "var(--accent)",
    content: <>P</>,
  },
};

function getProfileMeta(profileId: ProfileId, overrideName?: string) {
  if (profileId === "familiar" || profileId === "cinthia" || profileId === "paulo") {
    return PROFILE_META[profileId];
  }
  const name = overrideName?.split(" ")[0]?.toUpperCase() ?? "NOVUS";
  const inicial = overrideName?.charAt(0)?.toUpperCase() ?? "N";
  return {
    name,
    sub: "Dados a importar",
    avatarBg: "rgba(120,110,95,.10)",
    avatarColor: "var(--muted)",
    content: <>{inicial}</>,
  };
}

/* ============================================================
   VestaShell — sidebar + topbar + update bar + slot para page
   ============================================================ */
export function VestaShell({
  profileId,
  initialPage = "home",
  onSwitchProfile,
  onBackToHall,
  loggedAs,
  loggedName,
  profileName,
  loggedRole,
  scopes,
  onUpdateScopes,
  profileIdForScopeKey,
  activeDomusId,
  onLogout,
  children,
}: {
  profileId: ProfileId;
  initialPage?: PageKey;
  onChangeProfile?: (id: ProfileId) => void;
  onSwitchProfile: () => void;
  onBackToHall?: () => void;
  loggedAs?: PersonaId;
  loggedName?: string;
  profileName?: string;
  loggedRole?: string | null;
  scopes?: ScopeMap;
  onUpdateScopes?: (next: ScopeMap) => void;
  profileIdForScopeKey?: (key: string) => string | null;
  activeDomusId?: string | null;
  onLogout?: () => void;
  children?: ReactNode;
}) {
  const [page, setPage] = useState<PageKey>(initialPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const goTo = (k: PageKey) => { setPage(k); setSidebarOpen(false); setMoreOpen(false); };
  // profileName = nome do perfil visualizado (pode ser membro diferente do logado)
  const meta = getProfileMeta(profileId, profileName ?? loggedName);
  const isFamily = profileId === "familiar" || profileId.startsWith("domus:");
  const loggedPersona = loggedAs ? getPersonaInfo(loggedAs) : null;
  const isVesta = loggedRole === "vesta" || loggedPersona?.role === "vesta";
  const canManageDomus = isVesta && profileId !== "paulo";
  const isMember = profileId.startsWith("member:");
  const hasFullPortfolio = !isMember || profileId.startsWith("member:demo-") || profileId === "member:luiza-abrantes";
  // Nome de exibição: usa loggedName (real do banco) ou fallback para getPersonaInfo
  const displayName = loggedName ?? (loggedAs ? getPersonaInfo(loggedAs).name : "Membro");
  const userData = getUser(profileId);
  const alertas = userData.alertas_list;
  const alertaCounts = {
    r: alertas.filter((a) => a.cor === "r").length,
    w: alertas.filter((a) => a.cor === "w").length,
    g: alertas.filter((a) => a.cor === "g").length,
  };
  const totalAlertas = alertas.length;

  useEffect(() => setPage(initialPage), [initialPage, profileId]);
  const alertaLabel =
    totalAlertas === 0
      ? "sem alertas"
      : totalAlertas === 1
      ? "1 alerta"
      : `${totalAlertas} alertas`;
  const alertaBreakdown = [
    { key: "r", count: alertaCounts.r, color: "var(--danger)", title: "Urgentes" },
    { key: "w", count: alertaCounts.w, color: "var(--warning)", title: "Atenção" },
    { key: "g", count: alertaCounts.g, color: "var(--success)", title: "Positivos" },
  ];

  useEffect(() => {
    if (page === "domus" && !canManageDomus) {
      setPage("home");
    }
  }, [canManageDomus, page]);

  const item = (key: PageKey, label: string, extra?: ReactNode) => (
    <div
      className={"nav-item" + (page === key ? " on" : "")}
      onClick={() => goTo(key)}
    >
      {NAV_ICONS[key]}
      {label}
      {extra}
    </div>
  );

  const topItem = (key: PageKey, label: string) => (
    <button className={page === key ? "on" : ""} onClick={() => goTo(key)}>{label}</button>
  );

  const moreMenu = (
    <div className="context-nav__menu" onPointerDown={(event) => event.stopPropagation()}>
      {topItem("alertas", `Alertas (${totalAlertas})`)}
      {hasFullPortfolio && topItem("rendimentos", "Rendimentos")}
      {hasFullPortfolio && topItem("aporte", "Acelerar breakeven")}
      {hasFullPortfolio && topItem("secundario", "Mercado secundário")}
      {hasFullPortfolio && topItem("regras", "Regras")}
      {hasFullPortfolio && topItem("drivers", "Influenciadores")}
      {canManageDomus && topItem("domus", "Gerir Domus")}
    </div>
  );

  return (
    <div className={"app" + (sidebarOpen ? " sidebar-open" : "") + (page === "domus" ? " managing-domus" : "")}>
      <div className={"mob-backdrop" + (sidebarOpen ? " open" : "")} onClick={() => setSidebarOpen(false)} />
      <nav className={"sidebar" + (sidebarOpen ? " open" : "")}>
        <div className="logo">
          <div className="logo-icon" style={{ fontSize: 18 }}>✦</div>
          <div>
            <div className="logo-name">Vesta</div>
            <div className="logo-sub">Sistema de Gestão Patrimonial Familiar</div>
          </div>
        </div>

        {isVesta && (
          <div className="active-profile-bar" onClick={onSwitchProfile} title="Trocar perfil">
            <div
              className="apb-avatar"
              style={{ background: meta.avatarBg, color: meta.avatarColor, fontSize: 14 }}
            >
              {meta.content}
            </div>
            <div className="apb-info">
              <div className="apb-name">{meta.name}</div>
              <div className="apb-sub">{meta.sub}</div>
            </div>
            <div className="apb-change">↩</div>
          </div>
        )}

        <div className="nav">
          {loggedAs && (
            <div
              style={{
                padding: "8px 14px",
                fontSize: 11,
                color: "var(--muted)",
                borderBottom: "1px solid var(--border, #E5DFD3)",
                marginBottom: 6,
                lineHeight: 1.4,
              }}
            >
              Logada como <strong style={{ color: "var(--accent)" }}>{displayName}</strong>
              {getPersonaInfo(loggedAs).role === "vesta" && (
                <span style={{
                  marginLeft: 6, fontSize: 9, fontWeight: 700, letterSpacing: ".08em",
                  padding: "1px 6px", borderRadius: 8,
                  background: "rgba(216,179,106,.20)", color: "#8A6B32",
                }}>VESTA</span>
              )}
            </div>
          )}

          {isVesta && (
            <div
              className="nav-item"
              onClick={onSwitchProfile}
              style={{ color: "rgba(212,175,55,.7)" }}
            >
              {NAV_ICONS.start}
              Trocar visão / perfil
            </div>
          )}


          {onLogout && (
            <div
              className="nav-item"
              onClick={onLogout}
              style={{ color: "var(--accent)" }}
            >
              {NAV_ICONS.user}
              Sair do Domus
            </div>
          )}


          {isFamily && (
            <>
              <div className="nav-sec nav-sec-fam">Domus</div>
              <div className="nav-item" onClick={() => goTo("home")}>
                {NAV_ICONS.consolidado}
                Consolidado Domus
              </div>
            </>
          )}

          <div className="nav-sec">Principal</div>
          {item("home", "Visão geral")}
          {hasFullPortfolio && item("posicao", "Posição atual")}
          {hasFullPortfolio && item("rendimentos", "Rendimentos recorrentes", <span style={{ marginLeft: "auto", fontSize: 12 }}>💰</span>)}
          {item(
            "alertas",
            "Alertas",
            <span
              style={{
                marginLeft: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(255,255,255,.08)",
                color: "rgba(255,255,255,.9)",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 10,
              }}
              title={`${alertaCounts.r} urgentes · ${alertaCounts.w} atenção · ${alertaCounts.g} positivos`}
            >
              {totalAlertas}
            </span>,
          )}

          {hasFullPortfolio && (
            <>
              <div className="nav-sec">Plano</div>
              {item("equiv", "Equivalência de taxas")}
              {item("validador", "Validador de troca")}
              {item("breakeven", "Breakeven")}
              {item("aporte", "Acelerar breakeven")}
              {item("projecao", "Projeção patrimônio")}
              {item("secundario", "Saída secundário")}
              {item("regras", "Regras — não mexer")}
              {item("upload", "Importar arquivos XP")}
              {item("drivers", "Influenciadores")}
            </>
          )}

          {canManageDomus && (
            <>
              <div className="nav-sec">Domus</div>
              {item(
                "domus",
                "Gerir Domus",
                <span style={{ marginLeft: "auto", fontSize: 12 }}>🏛</span>,
              )}
            </>
          )}
        </div>

        <div className="sidebar-foot" />

      </nav>

      <div className="main">
        {page === "domus" && (
          <nav className="management-header">
            <button onClick={onBackToHall ?? onSwitchProfile}>← Hall</button>
            <strong>Vesta · Gestão do Domus</strong>
            <span />
            {onLogout && <button onClick={onLogout}>Sair</button>}
          </nav>
        )}
        <div className="topbar">
          <button className="mob-menu-btn" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="topbar-title">
              Vesta{" "}
              <span
                style={{
                  color: "var(--accent)",
                  fontFamily: "var(--font-display)",
                  fontSize: 13,
                  letterSpacing: ".05em",
                }}
              >
                ✦
              </span>{" "}
              Centro de Decisão Financeira
            </div>
            <div className="topbar-sub" style={{ whiteSpace: "pre-line" }}>
              {isFamily 
                ? "Visão do Domus ·\u00A0\nCinthia VESTA como gestora\nPatrimonium Consolidatum" 
                : `Carteira ${meta.name}\u00A0${
                    profileId === "paulo" ? "\nPost Reformam\u00A0·\u00A0MMXXVI\u00A0" : 
                    profileId === "cinthia" ? "\nCustos Ignis et Patrimonni" : ""
                  }`}
            </div>
          </div>
          <div className="badge-alert">{alertaLabel}</div>
        </div>

        <nav className="context-nav" aria-label="Navegação da carteira">
          <button className="context-nav__back" onClick={onBackToHall ?? onSwitchProfile}>← Hall</button>
          {topItem("home", "Visão geral")}
          {hasFullPortfolio && topItem("posicao", "Posição")}
          {hasFullPortfolio && topItem("breakeven", "Breakeven")}
          {hasFullPortfolio && topItem("equiv", "Equivalência")}
          {hasFullPortfolio && topItem("validador", "Validador")}
          {hasFullPortfolio && topItem("projecao", "Projeção")}
          {!isFamily && topItem("upload", "Importar posição mensal")}
          <div className={"context-nav__more" + (moreOpen ? " open" : "")}>
            <button
              type="button"
              aria-expanded={moreOpen}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMoreOpen((v) => !v);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setMoreOpen((v) => !v);
                }
              }}
            >
              Mais
            </button>
            <div className="context-nav__menu-legacy">
              {topItem("alertas", `Alertas (${totalAlertas})`)}
              {hasFullPortfolio && topItem("rendimentos", "Rendimentos")}
              {hasFullPortfolio && topItem("aporte", "Acelerar breakeven")}
              {hasFullPortfolio && topItem("secundario", "Mercado secundário")}
              {hasFullPortfolio && topItem("regras", "Regras")}
              {hasFullPortfolio && topItem("drivers", "Influenciadores")}
              {canManageDomus && topItem("domus", "Gerir Domus")}
            </div>
          </div>
          <span className="context-nav__spacer" />
          {onLogout && <button onClick={onLogout}>Sair</button>}
        </nav>
        {moreOpen && (
          <>
            <button
              type="button"
              className="context-nav__scrim"
              aria-label="Fechar menu Mais"
              onPointerDown={() => setMoreOpen(false)}
            />
            {moreMenu}
          </>
        )}

        <div className="update-bar">
          <div className="upd-dot off" />
          <span>
            CDI <b>14,75%</b>
          </span>
          <span>·</span>
          <span>
            IPCA <b>5,50%</b>
          </span>
          {(() => {
            const total = userData.total;
            return total > 0 ? (
              <>
                <span>·</span>
                <span>Patrimônio projetado <b>R$ {(total / 1000).toFixed(0)}k</b></span>
              </>
            ) : null;
          })()}
          <span style={{ marginLeft: "auto", fontSize: 10 }} />
          <button className="upd-btn">↻ atualizar</button>
        </div>

        <div className="content">
          <div className="page on">
            {page === "home" && (
              <HomePage profileId={profileId} overrideName={profileName ?? loggedName} />
            )}
            {page === "posicao" && <PosicaoPage profileId={profileId} />}
            {page === "breakeven" && <BreakevenPage profileId={profileId} />}
            {page === "equiv" && <EquivPage />}
            {page === "validador" && <ValidadorPage />}
            {page === "projecao" && <ProjecaoPage profileId={profileId} />}
            {page === "secundario" && <SecundarioPage />}
            {page === "alertas" && <AlertasPage profileId={profileId} />}
            {page === "regras" && <RegrasPage profileId={profileId} />}
            {page === "upload" && (
              <UploadPage
                targetAccountId={profileId.startsWith("member:") ? profileId.slice(7) : profileId}
                targetAccountName={profileName ?? meta.name}
              />
            )}
            {page === "drivers" && <DriversPage />}
            {page === "aporte" && <AportePage />}
            {page === "rendimentos" && <RendimentosPage profileId={profileId} />}
            {page === "domus" && canManageDomus && scopes && onUpdateScopes && (
              <DomusPage
                scopes={scopes}
                onUpdateScopes={onUpdateScopes}
                profileIdForScopeKey={profileIdForScopeKey}
                initialDomusId={activeDomusId}
              />
            )}
            {!["home", "posicao", "breakeven", "equiv", "validador", "projecao", "secundario", "alertas", "regras", "upload", "drivers", "aporte", "rendimentos", "domus"].includes(page) && (
              <div className="ph">
                <h1>Em breve</h1>
                <p>Este módulo será migrado nas próximas rodadas.</p>
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

