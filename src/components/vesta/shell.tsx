import { type ReactElement, type ReactNode, useState } from "react";

import { HomePage } from "@/components/vesta/pages/home";
import { PosicaoPage } from "@/components/vesta/pages/posicao";
import { BreakevenPage } from "@/components/vesta/pages/breakeven";
import { EquivPage } from "@/components/vesta/pages/equiv";
import { ValidadorPage } from "@/components/vesta/pages/validador";

import type { ProfileId } from "@/lib/profile-derive";

/* ============================================================
   ProfileSelector — replica exata de #profile-screen do vesta.html
   ============================================================ */
export function ProfileSelector({ onSelect }: { onSelect: (id: ProfileId) => void }) {
  return (
    <div id="profile-screen">
      <div className="ps-vesta">✦ Vesta ✦</div>
      <div className="ps-title">Guardiã do Patrimônio</div>
      <div className="ps-subtitle">Selecione o perfil de acesso</div>

      <div className="ps-profiles">
        <div className="ps-card" onClick={() => onSelect("familiar")}>
          <div className="ps-avatar ps-av-fam" style={{ fontSize: 20 }}>🏛</div>
          <div>
            <div className="ps-card-name">Familiar</div>
            <div className="ps-card-desc" style={{ margin: "6px 0 10px" }}>
              Visão consolidada<br />das duas carteiras<br />e todas as ferramentas
            </div>
            <div className="ps-card-badge ps-badge-fam">Acesso total</div>
          </div>
        </div>

        <div className="ps-card" onClick={() => onSelect("cinthia")}>
          <div className="ps-avatar ps-av-cinthia">C</div>
          <div>
            <div className="ps-card-name">Cinthia</div>
            <div className="ps-card-desc" style={{ margin: "6px 0 10px" }}>
              Carteira XP 6414212<br />visão individual<br />&nbsp;
            </div>
            <div className="ps-card-badge ps-badge-ind">Individual</div>
          </div>
        </div>

        <div className="ps-card" onClick={() => onSelect("paulo")}>
          <div className="ps-avatar ps-av-paulo">P</div>
          <div>
            <div className="ps-card-name">Paulo</div>
            <div className="ps-card-desc" style={{ margin: "6px 0 10px" }}>
              Carteira XP 5296823<br />visão individual<br />&nbsp;
            </div>
            <div className="ps-card-badge ps-badge-ind">Individual</div>
          </div>
        </div>
      </div>

      <div className="ps-ornament">Família Furtado · 2026</div>
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
  | "regras"
  | "upload"
  | "drivers"
  | "aporte";

const PROFILE_META: Record<ProfileId, { name: string; sub: string; avatarBg: string; avatarColor: string; content: ReactNode }> = {
  familiar: {
    name: "Familiar",
    sub: "Todas as carteiras",
    avatarBg: "rgba(196,149,42,.15)",
    avatarColor: "#C4952A",
    content: <span style={{ fontSize: 14 }}>🏛</span>,
  },
  cinthia: {
    name: "Cinthia",
    sub: "XP 6414212",
    avatarBg: "rgba(160,120,140,.12)",
    avatarColor: "#C09090",
    content: <>C</>,
  },
  paulo: {
    name: "Paulo",
    sub: "XP 5296823",
    avatarBg: "rgba(196,100,80,.12)",
    avatarColor: "#C47050",
    content: <>P</>,
  },
};

/* ============================================================
   VestaShell — sidebar + topbar + update bar + slot para page
   ============================================================ */
export function VestaShell({
  profileId,
  onSwitchProfile,
  children,
}: {
  profileId: ProfileId;
  onChangeProfile?: (id: ProfileId) => void;
  onSwitchProfile: () => void;
  children?: ReactNode;
}) {
  const [page, setPage] = useState<PageKey>("home");
  const meta = PROFILE_META[profileId];
  const isFamily = profileId === "familiar";

  const item = (key: PageKey, label: string, extra?: ReactNode) => (
    <div
      className={"nav-item" + (page === key ? " on" : "")}
      onClick={() => setPage(key)}
    >
      {NAV_ICONS[key]}
      {label}
      {extra}
    </div>
  );

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="logo">
          <div className="logo-icon" style={{ fontSize: 18 }}>✦</div>
          <div>
            <div className="logo-name">Vesta</div>
            <div className="logo-sub">Gestão patrimonial familiar</div>
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
          <div
            className="nav-item"
            onClick={onSwitchProfile}
            style={{ color: "rgba(212,175,55,.7)" }}
          >
            {NAV_ICONS.start}
            Tela inicial / perfis
          </div>

          {isFamily && (
            <>
              <div className="nav-sec nav-sec-fam">Família</div>
              <div className="nav-item" onClick={() => setPage("home")}>
                {NAV_ICONS.consolidado}
                Consolidado Familiar
              </div>
            </>
          )}

          <div className="nav-sec">Principal</div>
          {item("home", "Visão geral")}
          {item("posicao", "Posição atual")}
          {item(
            "alertas",
            "Alertas",
            <span
              style={{
                marginLeft: "auto",
                background: "var(--danger)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: 10,
              }}
            >
              2
            </span>,
          )}

          <div className="nav-sec">Plano</div>
          {item("equiv", "Equivalência de taxas")}
          {item("validador", "Validador de troca")}
          {item("breakeven", "Breakeven")}
          {item("regras", "Regras — não mexer")}
          {item("upload", "Importar arquivos XP")}
          {item("drivers", "Influenciadores")}
          {item("aporte", "Acelerar breakeven")}
        </div>

        <div className="sidebar-foot">
          <div
            className="nav-item"
            style={{ color: "rgba(255,255,255,.35)", fontSize: 12 }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              style={{ width: 15, height: 15 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Ref. 02/07/2026 · CDI 14,75%
          </div>
        </div>
      </nav>

      <div className="main">
        <div className="topbar">
          <div>
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
            <div className="topbar-sub">
              {isFamily ? "Visão familiar · Cinthia como gestora" : `Carteira ${meta.name}`}
            </div>
          </div>
          <div className="badge-alert">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            2 alertas ativos
          </div>
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
            {page === "home" && <HomePage />}
            {page === "posicao" && <PosicaoPage />}
            {page === "breakeven" && <BreakevenPage />}
            {page === "equiv" && <EquivPage />}
            {page === "validador" && <ValidadorPage />}
            {!["home", "posicao", "breakeven", "equiv", "validador"].includes(page) && (
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
