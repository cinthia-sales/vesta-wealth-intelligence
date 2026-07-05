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
import { PERSONAE, type PersonaId, type Scope } from "@/state/session";

/* ============================================================
   ProfileSelector — replica exata de #profile-screen do vesta.html
   ============================================================ */
export function ProfileSelector({
  onSelect,
  allowed,
  loggedAs,
  onLogout,
}: {
  onSelect: (id: ProfileId) => void;
  allowed?: ProfileId[];
  loggedAs?: PersonaId;
  onLogout?: () => void;
}) {
  const canSee = (id: ProfileId) => !allowed || allowed.includes(id);

  return (
    <div id="profile-screen">
      <div className="ps-vesta">✦ Vesta ✦</div>
      <div className="ps-title">Guardiã do Patrimônio</div>
      <div className="ps-subtitle">
        {loggedAs
          ? `Entrou como ${PERSONAE[loggedAs].name} · selecione a visão`
          : "Selecione o perfil de acesso"}
      </div>

      <div className="ps-profiles">
        {canSee("familiar") && (
          <div className="ps-card" onClick={() => onSelect("familiar")}>
            <div className="ps-avatar ps-av-fam" style={{ fontSize: 20 }}>🏛</div>
            <div>
              <div className="ps-card-name">FAMILIAR<br />DOMUS</div>
              <div className="ps-card-desc" style={{ margin: "6px 0 10px" }}>
                Visão consolidada<br />das duas carteiras<br />e todas as ferramentas
              </div>
              <div className="ps-card-badge ps-badge-fam">Acesso total<br />&nbsp;Vestæ Tantum</div>
            </div>
          </div>
        )}

        {canSee("cinthia") && (
          <div className="ps-card" onClick={() => onSelect("cinthia")}>
            <div className="ps-avatar ps-av-cinthia">C</div>
            <div>
              <div className="ps-card-name">CÍNTHIA<br />VESTA</div>
              <div className="ps-card-desc" style={{ margin: "6px 0 10px" }}>
                Carteira XP 6414212<br />visão individual<br />&nbsp;
              </div>
              <div className="ps-card-badge ps-badge-ind">Individual<br />Infinitus</div>
            </div>
          </div>
        )}

        {canSee("paulo") && (
          <div className="ps-card" onClick={() => onSelect("paulo")}>
            <div className="ps-avatar ps-av-paulo">P</div>
            <div>
              <div className="ps-card-name">PAULO<br />EFFLUXUS</div>
              <div className="ps-card-desc" style={{ margin: "6px 0 10px" }}>
                Carteira XP 5296823<br />visão individual<br />&nbsp;
              </div>
              <div className="ps-card-badge ps-badge-ind">Individual<br />&nbsp;Restrictus</div>
            </div>
          </div>
        )}
      </div>

      <div className="ps-ornament">
        Família Malta Furtado · 2026
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

const PROFILE_META: Record<ProfileId, { name: string; sub: string; avatarBg: string; avatarColor: string; content: ReactNode }> = {
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

/* ============================================================
   VestaShell — sidebar + topbar + update bar + slot para page
   ============================================================ */
export function VestaShell({
  profileId,
  onSwitchProfile,
  loggedAs,
  scopes,
  onUpdateScopes,
  onLogout,
  children,
}: {
  profileId: ProfileId;
  onChangeProfile?: (id: ProfileId) => void;
  onSwitchProfile: () => void;
  loggedAs?: PersonaId;
  scopes?: Record<PersonaId, Scope>;
  onUpdateScopes?: (next: Record<PersonaId, Scope>) => void;
  onLogout?: () => void;
  children?: ReactNode;
}) {
  const [page, setPage] = useState<PageKey>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const goTo = (k: PageKey) => { setPage(k); setSidebarOpen(false); };
  const meta = PROFILE_META[profileId];
  const isFamily = profileId === "familiar";
  const isVesta = loggedAs ? PERSONAE[loggedAs].role === "vesta" : false;
  const canManageDomus = isVesta && profileId !== "paulo";
  const alertas = getUser(profileId).alertas_list;
  const alertaCounts = {
    r: alertas.filter((a) => a.cor === "r").length,
    w: alertas.filter((a) => a.cor === "w").length,
    g: alertas.filter((a) => a.cor === "g").length,
  };
  const totalAlertas = alertas.length;
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

  return (
    <div className={"app" + (sidebarOpen ? " sidebar-open" : "")}>
      <div className={"mob-backdrop" + (sidebarOpen ? " open" : "")} onClick={() => setSidebarOpen(false)} />
      <nav className={"sidebar" + (sidebarOpen ? " open" : "")}>
        <div className="logo">
          <div className="logo-icon" style={{ fontSize: 18 }}>✦</div>
          <div>
            <div className="logo-name">Vesta</div>
            <div className="logo-sub">Sitema de Gestão Patrimonial Familiar</div>
          </div>
        </div>

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
              Logada como <strong style={{ color: "var(--accent)" }}>{PERSONAE[loggedAs].name}</strong>
              {PERSONAE[loggedAs].role === "vesta" && (
                <span style={{
                  marginLeft: 6, fontSize: 9, fontWeight: 700, letterSpacing: ".08em",
                  padding: "1px 6px", borderRadius: 8,
                  background: "rgba(216,179,106,.20)", color: "#8A6B32",
                }}>VESTA</span>
              )}
            </div>
          )}

          <div
            className="nav-item"
            onClick={onSwitchProfile}
            style={{ color: "rgba(212,175,55,.7)" }}
          >
            {NAV_ICONS.start}
            Trocar visão / perfil
          </div>

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
              <div className="nav-sec nav-sec-fam">Família</div>
              <div className="nav-item" onClick={() => goTo("home")}>
                {NAV_ICONS.consolidado}
                Consolidado Familiar
              </div>
            </>
          )}

          <div className="nav-sec">Principal</div>
          {item("home", "Visão geral")}
          {item("posicao", "Posição atual")}
          {item("rendimentos", "Rendimentos recorrentes", <span style={{ marginLeft: "auto", fontSize: 12 }}>💰</span>)}
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
                ? "Visão familiar ·\u00A0\nCinthia VESTA como gestora\nPatrimonium Consolidatum" 
                : `Carteira ${meta.name}${
                    profileId === "paulo" ? "\nPost Reformam . MMXXVI\u00A0" : 
                    profileId === "cinthia" ? "\nCustos Ignis et Patrimonni" : ""
                  }`}
            </div>
          </div>
          <div className="badge-alert">{alertaLabel}</div>
        </div>

        <div className="update-bar">
          <div className="upd-dot off" />
          <span>
            CDI <b>14,75%</b>
          </span>
          <span>·</span>
          <span>
            IPCA <b>5,50%</b>
          </span>
          <span>·</span>
          <span>
            Patrimônio projetado <b>R$ 648k</b>
          </span>
          <span style={{ marginLeft: "auto", fontSize: 10 }} />
          <button className="upd-btn">↻ atualizar</button>
        </div>

        <div className="content">
          <div className="page on">
            {page === "home" && <HomePage profileId={profileId} />}
            {page === "posicao" && <PosicaoPage profileId={profileId} />}
            {page === "breakeven" && <BreakevenPage />}
            {page === "equiv" && <EquivPage />}
            {page === "validador" && <ValidadorPage />}
            {page === "projecao" && <ProjecaoPage profileId={profileId} />}
            {page === "secundario" && <SecundarioPage />}
            {page === "alertas" && <AlertasPage profileId={profileId} />}
            {page === "regras" && <RegrasPage profileId={profileId} />}
            {page === "upload" && <UploadPage />}
            {page === "drivers" && <DriversPage />}
            {page === "aporte" && <AportePage />}
            {page === "rendimentos" && <RendimentosPage profileId={profileId} />}
            {page === "domus" && canManageDomus && scopes && onUpdateScopes && (
              <DomusPage scopes={scopes} onUpdateScopes={onUpdateScopes} />
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
