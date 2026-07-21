import { type ReactElement, type ReactNode, useEffect, useState } from "react";

import { HomePage } from "@/components/vesta/pages/home";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
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
import { RVPage } from "@/components/vesta/pages/rv";
import { OportunidadePage } from "@/components/vesta/pages/oportunidade";
import { AuditoriaPage } from "@/components/vesta/pages/auditoria";
import { RaioXPage } from "@/components/vesta/pages/raiox";
import { carregarGiros, removerGiro } from "@/data/carteira-ativos";
import { isAssetLocked } from "@/data/asset-locks";

import type { ProfileId } from "@/lib/profile-derive";
import { getUser } from "@/data/vesta-users";
import { getPersonaInfo, type PersonaId, type ScopeMap } from "@/state/session";

/* ============================================================
   ProfileSelector â€” replica exata de #profile-screen do vesta.html
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
                    <div className="ps-avatar ps-av-fam" style={{ fontSize: 20 }}>ðŸ›</div>
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
              <div className="ps-avatar ps-av-fam" style={{ fontSize: 20 }}>ðŸ›</div>
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
   Nav items â€” SVGs replicados do vesta.html
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
  projecao: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M7 15l3-4 3 2 5-7" />
      <path d="M16 6h2v2" />
    </svg>
  ),
  secundario: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 7h10a4 4 0 010 8H8" />
      <path d="M9 4L6 7l3 3" />
      <path d="M15 20l3-3-3-3" />
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
  raiox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L21 21" />
      <path d="M8 11h6" />
      <path d="M11 8v6" />
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
  | "raiox"
  | "aporte"
  | "rendimentos"
  | "domus"
  | "rv"
  | "oportunidade"
  | "auditoria";

const PROFILE_META: Record<"familiar" | "cinthia" | "paulo", { name: string; sub: string; avatarBg: string; avatarColor: string; content: ReactNode }> = {
  familiar: {
    name: "FAMILIAR - DOMUS",
    sub: "Todas as carteiras",
    avatarBg: "rgba(161,29,62,.10)",
    avatarColor: "var(--accent)",
    content: <span style={{ fontSize: 14 }}>ðŸ›</span>,
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
  const name = (overrideName?.split(" ")[0] ?? "Novus").toUpperCase();
  const inicial = overrideName?.charAt(0)?.toUpperCase() ?? "N";
  return {
    name,
    sub: "Carteira selecionada",
    avatarBg: "rgba(120,110,95,.10)",
    avatarColor: "var(--muted)",
    content: <>{inicial}</>,
  };
}

/* ============================================================
   VestaShell â€” sidebar + topbar + update bar + slot para page
   ============================================================ */
export function VestaShell({
  profileId,
  initialPage = "home",
  onSwitchProfile,
  onBackToHall,
  loggedAs,
  loggedName,
  profileName,
  gestoraName,
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
  gestoraName?: string;
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(230);
  const goTo = (k: PageKey) => { setPage(k); setSidebarOpen(false); };
  const startSidebarResize = (ev: ReactPointerEvent<HTMLDivElement>) => {
    ev.preventDefault();
    const startX = ev.clientX;
    const startWidth = sidebarWidth;
    const move = (moveEv: PointerEvent) => {
      const next = Math.min(340, Math.max(190, startWidth + moveEv.clientX - startX));
      setSidebarWidth(next);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  /* CDI (série 4389) e IPCA 12m (série 13522) direto do Banco Central */
  const [bcbCdi, setBcbCdi] = useState<number | null>(null);
  const [bcbIpca, setBcbIpca] = useState<number | null>(null);
  const [bcbLive, setBcbLive] = useState(false);
  const atualizarBCB = async () => {
    try {
      const fetchSerie = async (s: number) => {
        const r = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${s}/dados/ultimos/1?formato=json`);
        const j = await r.json();
        const v = parseFloat(j?.[0]?.valor);
        return isNaN(v) ? null : v;
      };
      const [cdi, ipca] = await Promise.all([fetchSerie(4389), fetchSerie(13522)]);
      if (cdi !== null) setBcbCdi(cdi);
      if (ipca !== null) setBcbIpca(ipca);
      setBcbLive(cdi !== null || ipca !== null);
    } catch {
      setBcbLive(false);
    }
  };
  useEffect(() => { void atualizarBCB(); }, []);
  // profileName = nome do perfil visualizado (pode ser membro diferente do logado)
  // Fallback para u.nome do snapshot quando o caller não sabe o nome do membro
  const userData = getUser(profileId);
  const resolvedProfileName = profileName ?? (userData?.nome !== loggedName ? userData?.nome : undefined) ?? loggedName;
  const meta = getProfileMeta(profileId, resolvedProfileName);
  const isFamily = profileId === "familiar" || profileId.startsWith("domus:");
  const loggedPersona = loggedAs ? getPersonaInfo(loggedAs) : null;
  const isVesta = loggedRole === "vesta" || loggedPersona?.role === "vesta";
  const canManageDomus = isVesta && profileId !== "paulo";
  const isMember = profileId.startsWith("member:");
  // Nome de exibição: usa loggedName (real do banco) ou fallback para getPersonaInfo
  const displayName = loggedName ?? (loggedAs ? getPersonaInfo(loggedAs).name : "Membro");
  const hasImportedPortfolio = userData.total > 0 || userData.rf_ativos.length > 0 || (userData.rv_ativos?.length ?? 0) > 0;
  const hasFullPortfolio = !isMember || profileId.startsWith("member:demo-") || profileId === "member:luiza-abrantes" || hasImportedPortfolio;
  const alertas = userData.alertas_list;
  const autoRVAlertas = countAutoRVAlerts(userData);
  const alertaCounts = {
    r: alertas.filter((a) => a.cor === "r").length + autoRVAlertas,
    w: alertas.filter((a) => a.cor === "w").length,
    g: alertas.filter((a) => a.cor === "g").length,
  };
  const totalAlertas = alertas.length + autoRVAlertas;

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

  const topItem = (key: PageKey, label: string, className = "") => (
    <button
      className={[page === key ? "on" : "", className].filter(Boolean).join(" ")}
      onClick={() => {
        setMoreOpen(false);
        goTo(key);
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      className={
        "app" +
        (sidebarOpen ? " sidebar-open" : "") +
        (sidebarCollapsed ? " sidebar-collapsed" : "") +
        (page === "domus" ? " managing-domus" : "")
      }
      style={{ "--vesta-sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <div className={"mob-backdrop" + (sidebarOpen ? " open" : "")} onClick={() => setSidebarOpen(false)} />
      <nav className={"sidebar" + (sidebarOpen ? " open" : "")}>
        <div className="logo">
          <button
            className="sidebar-collapse-btn logo-icon logo-icon-star"
            aria-label={sidebarCollapsed ? "Mostrar menu" : "Esconder menu"}
            onClick={() => setSidebarCollapsed((v) => !v)}
          />
          <div>
            <div className="logo-name">Vesta</div>
            <div className="logo-sub">Sistema de Gestão Patrimonial Familiar</div>
          </div>
          <button
            className="sidebar-collapse-arrow"
            aria-label={sidebarCollapsed ? "Expandir barra lateral" : "Encolher barra lateral"}
            title={sidebarCollapsed ? "Expandir barra lateral" : "Encolher barra lateral"}
            onClick={() => setSidebarCollapsed((v) => !v)}
          >
            {sidebarCollapsed ? "›" : "‹"}
          </button>
        </div>

        {isVesta && (
          <div className="active-profile-bar" title="Perfil em visualização">
            <div
              className="apb-avatar"
              style={{ background: meta.avatarBg, color: meta.avatarColor, fontSize: 14 }}
            >
              {meta.content}
            </div>
            <div className="apb-info">
              <div className="apb-name">{meta.name.toUpperCase()}</div>
              <div className="apb-sub">{meta.sub}</div>
            </div>
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
          {hasFullPortfolio && item("rendimentos", "Rendimentos recorrentes", <span className="nav-money-icon" aria-label="proventos" />)}
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

          {!isFamily && item("upload", "Importar arquivos")}

          {hasFullPortfolio && (
            <>
              <div className="nav-sec">Decidir</div>
              {item("breakeven", "Custo de oportunidade")}
              {item("auditoria", "Auditoria de ações")}
              {item("projecao", "Projeção patrimônio")}
              {item("secundario", "Saída secundário")}
              <div className="nav-sec">Sistema</div>
              {item("regras", "Regras — não mexer")}
              {item("raiox", "Raio-X do ativo")}
              {item("drivers", "Influenciadores")}
            </>
          )}

          {canManageDomus && (
            <>
              <div className="nav-sec">Domus</div>
              {item(
                "domus",
                "Gerir Domus",
              )}
            </>
          )}
        </div>

        <div className="sidebar-foot" />
        {!sidebarCollapsed && (
          <div className="sidebar-resizer" onPointerDown={startSidebarResize} title="Arraste para ajustar a largura" />
        )}

      </nav>

      <div className="main">
        {page === "domus" && (
          <nav className="management-header">
            <button onClick={onBackToHall ?? onSwitchProfile}>â† Hall</button>
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
              Vesta · Centro de Decisão Financeira
            </div>
            <div className="topbar-sub" style={{ whiteSpace: "pre-line" }}>
              {isFamily 
                ? `Visão do Domus ·\u00A0\n${gestoraName ?? "Cinthia"} VESTA como gestora\nPatrimonium Consolidatum` 
                : `Carteira ${meta.name}\u00A0${
                    profileId === "paulo" ? "\nPost Reformam\u00A0·\u00A0MMXXVI\u00A0" : 
                    profileId === "cinthia" ? "\nCustos Ignis et Patrimonni" : ""
                  }`}
            </div>
          </div>
          <div className="badge-alert">{alertaLabel}</div>
        </div>

        <nav className="context-nav" aria-label="Navegação da carteira">
          {topItem("home", "Visão geral")}
          {hasFullPortfolio && topItem("posicao", "Posição")}
          {hasFullPortfolio && topItem("raiox", "Raio-X")}
          {topItem("alertas", `Alertas (${totalAlertas})`)}
          {hasFullPortfolio && topItem("projecao", "Projeção patrimônio")}
          <span className="context-nav__spacer" />
          {onLogout && <button onClick={onLogout}>Sair</button>}
        </nav>

        <div className="update-bar">
          <div className={"upd-dot" + (bcbLive ? "" : " off")} />
          <span>
            CDI <b>{(bcbCdi ?? 14.75).toFixed(2).replace(".", ",")}%</b>
          </span>
          <span>·</span>
          <span>
            IPCA <b>{(bcbIpca ?? 5.5).toFixed(2).replace(".", ",")}%</b>
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
          <span style={{ marginLeft: "auto", fontSize: 10 }}>
            {bcbLive ? "BCB · ao vivo" : "valores de referência"}
          </span>
          <button className="upd-btn" onClick={() => void atualizarBCB()}>↻ atualizar</button>
        </div>

        <div className="content">
          <div className="page on">
            {page === "home" && (
              <HomePage profileId={profileId} overrideName={profileName ?? loggedName} loggedName={loggedName} />
            )}
            {page === "posicao" && <PosicaoPage profileId={profileId} />}
            {page === "breakeven" && <BreakevenTabs profileId={profileId} bcbCdi={bcbCdi} bcbIpca={bcbIpca} />}
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
            {page === "raiox" && <RaioXPage />}
            {page === "aporte" && <AportePage />}
            {page === "rendimentos" && <RendimentosPage profileId={profileId} />}
            {page === "rv" && <RVPage />}
            {page === "oportunidade" && <OportunidadePage profileId={profileId} />}
            {page === "auditoria" && <AuditoriaPage profileId={profileId} />}
            {page === "domus" && canManageDomus && scopes && onUpdateScopes && (
              <DomusPage
                scopes={scopes}
                onUpdateScopes={onUpdateScopes}
                profileIdForScopeKey={profileIdForScopeKey}
                initialDomusId={activeDomusId}
                activeProfileId={profileId}
              />
            )}
            {!["home", "posicao", "breakeven", "auditoria", "raiox", "equiv", "validador", "projecao", "secundario", "alertas", "regras", "upload", "drivers", "aporte", "rendimentos", "domus", "rv", "oportunidade"].includes(page) && (
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

/* ============================================================
   BreakevenTabs â€” Breakeven & giros com "Acelerar com aporte"
   como aba, + painel de giros registrados pela tela
   Custo de Oportunidade (localStorage)
   ============================================================ */
function GirosRegistradosPanel() {
  const [giros, setGiros] = useState(() => carregarGiros());
  if (giros.length === 0) return null;
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-hdr">
        Giros registrados no Custo de Oportunidade
        <span>{giros.length} pendente(s) de execução</span>
      </div>
      {giros.map((g) => {
        const bkMeses = g.ganhoMesEstimado > 0 && g.custoSaida > 0
          ? Math.ceil(g.custoSaida / g.ganhoMesEstimado)
          : 0;
        const passivo = g.passivoOportunidade ?? 0;
        const metaReal = g.custoSaida + passivo;
        const bkReal = g.breakevenComPassivoMes ?? (
          g.ganhoMesEstimado > 0 && metaReal > 0 ? Math.ceil(metaReal / g.ganhoMesEstimado) : 0
        );
        return (
          <div
            key={g.id}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
              borderBottom: "1px solid var(--border)", fontSize: 12.5, flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 220 }}>
              <b>{g.origem}</b> â†’ {g.destino}
              <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
                Capital R$ {Math.round(g.capital).toLocaleString("pt-BR")} ·
                ganho estimado +R$ {Math.round(g.ganhoMesEstimado).toLocaleString("pt-BR")}/mês ·
                {g.custoSaida > 0
                  ? ` paga custo de saída em ${bkMeses} ${bkMeses === 1 ? "mês" : "meses"}`
                  : " sem custo de saída"} ·
                {passivo > 0
                  ? ` passivo R$ ${Math.round(passivo).toLocaleString("pt-BR")} · breakeven real ${bkReal} ${bkReal === 1 ? "mês" : "meses"} ·`
                  : ""}
                registrado {new Date(g.criadoEm).toLocaleDateString("pt-BR")}
              </div>
            </div>
            <button
              onClick={() => { removerGiro(g.id); setGiros(carregarGiros()); }}
              style={{
                background: "none", border: "1px solid var(--border)", borderRadius: 7,
                padding: "5px 12px", fontSize: 11, cursor: "pointer",
                color: "var(--muted-foreground)", fontFamily: "inherit",
              }}
            >
              remover
            </button>
          </div>
        );
      })}
    </div>
  );
}

function parseBRLText(value: string | undefined) {
  if (!value) return 0;
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function fgcLikelyCovered(nome: string) {
  return /\b(CDB|LCI|LCA|LCD|LC\b|RDB)\b/i.test(nome);
}

function tesouroSoberano(nome: string) {
  return /TESOURO|LFT|NTN-B|LTN/i.test(nome);
}

function fmtRk(n: number) {
  if (Math.abs(n) >= 1_000_000) return "R$ " + (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return "R$ " + Math.round(n / 1_000) + "k";
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}

function fmtBRL(n: number) {
  return "R$ " + Math.round(n).toLocaleString("pt-BR");
}

function stripImportadoXP(value: string) {
  return value.replace(/\s*[·-]\s*Importado XP\s*/gi, "").replace(/\s*Importado XP\s*/gi, "").trim();
}

function parseMoneyFromText(value: string) {
  const n = Number(value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function splitPMCotacao(value: string) {
  const normalized = value.replace(/\s*[··-]\s*Importado XP\s*/gi, "").replace(/\s*Importado XP\s*/gi, "").replace(/\s+/g, " ").trim();
  return {
    pm: normalized.match(/PM\s*(R\$\s*[\d.,]+)/i)?.[1] ?? normalized.match(/^(R\$\s*[\d.,]+)/i)?.[1] ?? "",
    cotacao: normalized.match(/Cot\.?\s*(R\$\s*[\d.,]+)/i)?.[1] ?? "",
  };
}

function countAutoRVAlerts(userData: ReturnType<typeof getUser>) {
  return (userData.rv_ativos ?? []).filter((a) => {
    const ref = splitPMCotacao(a.pm);
    const pm = parseMoneyFromText(ref.pm);
    const cotacao = parseMoneyFromText(ref.cotacao);
    return pm !== null && cotacao !== null && cotacao < pm;
  }).length;
}

function rfTaxaLabel(a: NonNullable<ReturnType<typeof getUser>["rf_ativos"]>[number]) {
  if (typeof a.cdi === "number") return `${a.cdi.toFixed(1).replace(".", ",")}% CDI`;
  if (typeof a.t === "number") return `${a.t.toFixed(2).replace(".", ",")}% a.a.`;
  return a.venc ? `vence ${a.venc}` : "taxa a conferir";
}

function cdiPctParaAtivo(a: NonNullable<ReturnType<typeof getUser>["rf_ativos"]>[number]): number {
  if (typeof a.cdi === "number") return a.cdi;
  const text = `${a.n} ${a.nota ?? ""}`;
  if (/Brasilprev/i.test(text)) return 85;
  if (/Previdên|Previd/i.test(text)) return 90;
  return 100;
}

function taxaRFAnual(a: NonNullable<ReturnType<typeof getUser>["rf_ativos"]>[number], cdiRef: number) {
  if (typeof a.t === "number") return a.t;
  const text = `${a.n} ${a.nota ?? ""}`;
  if (/NTN-B|IPCA\s*\+/i.test(text)) return 5.5 + 5; // IPCA atual + cupom padrão
  if (typeof a.cdi === "number") return (a.cdi / 100) * cdiRef;
  if (/CDI|Selic|LFT|FIDC|CDB|LCA|LCI|LCD|XPAG|LFTB|Previdên|Previd|Brasilprev/i.test(text))
    return (cdiPctParaAtivo(a) / 100) * cdiRef;
  return 0;
}

function taxaRVReferencia(a: NonNullable<ReturnType<typeof getUser>["rv_ativos"]>[number]) {
  const ticker = a.n.split(" ")[0].replace(/[^A-Z0-9]/g, "");
  const classe = `${a.cls} ${a.n}`.toLowerCase();
  if (/fii|fi-agro|fundo imobili|agro/.test(classe) || /^[A-Z]{4}11$/.test(ticker)) return 6;
  if (/a[cç][aã]o|ações|acao/.test(classe) || /^[A-Z]{4}[0-9]$/.test(ticker)) return 2;
  return 0;
}

function rvAbaixoDoPM(a: NonNullable<ReturnType<typeof getUser>["rv_ativos"]>[number]) {
  const ref = splitPMCotacao(a.pm);
  const pm = parseMoneyFromText(ref.pm);
  const cotacao = parseMoneyFromText(ref.cotacao);
  return pm !== null && cotacao !== null && cotacao < pm;
}

function rvEconomiaPM(a: NonNullable<ReturnType<typeof getUser>["rv_ativos"]>[number]) {
  const ref = splitPMCotacao(a.pm);
  const pm = parseMoneyFromText(ref.pm);
  const cotacao = parseMoneyFromText(ref.cotacao);
  const qtdMatch = a.pm.match(/([\d.]+)\s*(cotas|ações|ações|titulos|títulos)/i);
  const qtd = qtdMatch ? Number(qtdMatch[1].replace(/\./g, "")) : null;
  const atual = parseBRLText(a.v);
  if (pm === null || cotacao === null) return { atual, investido: null, delta: null, deltaPct: null };
  const investido = qtd && qtd > 0 ? pm * qtd : atual * (pm / Math.max(cotacao, 0.01));
  const delta = atual - investido;
  return {
    atual,
    investido,
    delta,
    deltaPct: investido > 0 ? (delta / investido) * 100 : null,
  };
}

function projectedRF10(a: NonNullable<ReturnType<typeof getUser>["rf_ativos"]>[number]) {
  const cdiBase = [14.75, 12.5, 10.5, 9.5, 9.0, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5];
  const ipcaBase = [5.5, 5.0, 4.5, 4.2, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0];
  const text = `${a.n} ${a.nota ?? ""}`;
  let value = a.v;
  for (let i = 1; i <= 10; i++) {
    const cdi = cdiBase[i] ?? cdiBase[cdiBase.length - 1];
    const ipca = ipcaBase[i] ?? ipcaBase[ipcaBase.length - 1];
    let taxa: number;
    if (/NTN-B|IPCA\s*\+/i.test(text)) {
      const real = Number((text.match(/IPCA\s*\+\s*(\d+(?:[,.]\d+)?)/i)?.[1] ?? "5").replace(",", "."));
      taxa = ipca + (Number.isFinite(real) ? real : 5);
    } else if (/pré|prefix|LTN|Daycoval/i.test(text)) {
      taxa = a.t ?? 12;
    } else if (a.cdi != null || /CDI|Selic|FIDC|CDB|LCA|LCI|LCD|XPAG|LFTB|Previdên|Previd|Brasilprev/i.test(text)) {
      taxa = (cdi * cdiPctParaAtivo(a)) / 100;
    } else {
      // Mantem compatibilidade com a pagina Projecao patrimonio:
      // ativo sem taxa/indexador claro fica sem crescimento automatico.
      taxa = 0;
    }
    value *= 1 + taxa / 100;
  }
  return value;
}

function projectedRV10(value: number) {
  return value * Math.pow(1 + 0.08, 10);
}

function projectionBase10(userData: ReturnType<typeof getUser>, profileId: ProfileId) {
  return (
    userData.rf_ativos.reduce((s, a) => s + projectedRF10(a), 0)
    + projectedRV10(userData.rv)
  );
}

function SugestaoGiroCarteira({ profileId }: { profileId: ProfileId }) {
  const [carregoAlvo, setCarregoAlvo] = useState(15);
  const u = getUser(profileId);
  const rv = u.rv_ativos ?? [];
  const cdiRef = 14.75;
  const corteCdi = cdiRef * 0.9;
  const rvProblematicos = rv.filter((a) => !isAssetLocked(profileId, a.n) && (rvAbaixoDoPM(a) || a.rc === "bad" || /^-/.test(a.r.trim())));
  const rvCandidata = rvProblematicos;
  const capitalRV = rvCandidata.reduce((s, a) => s + parseBRLText(a.v), 0);
  const rvEconomia = rv.reduce(
    (acc, a) => {
      const e = rvEconomiaPM(a);
      if (e.investido === null || e.delta === null) return acc;
      acc.investido += e.investido;
      acc.atual += e.atual;
      acc.delta += e.delta;
      return acc;
    },
    { investido: 0, atual: 0, delta: 0 },
  );
  const rvCandidataEconomia = rvCandidata.reduce(
    (acc, a) => {
      const e = rvEconomiaPM(a);
      if (e.investido === null || e.delta === null) return acc;
      acc.investido += e.investido;
      acc.atual += e.atual;
      acc.delta += e.delta;
      return acc;
    },
    { investido: 0, atual: 0, delta: 0 },
  );
  const rfBaixoCdi = u.rf_ativos.filter((a) => !isAssetLocked(profileId, a.n) && typeof a.cdi === "number" && a.cdi < 90);
  const rfTaxaBaixa = u.rf_ativos.filter((a) => !isAssetLocked(profileId, a.n) && a.cdi === null && typeof a.t === "number" && a.t < corteCdi && !tesouroSoberano(a.n));
  const rfParaRever = [...rfBaixoCdi, ...rfTaxaBaixa].filter((a, idx, arr) => arr.findIndex((b) => b.n === a.n) === idx);
  const tesouroParaRever = u.rf_ativos.filter((a) => tesouroSoberano(a.n));
  const capitalRFRever = rfParaRever.reduce((s, a) => s + a.v, 0);
  const capitalGiro = capitalRV + capitalRFRever;
  const fgcCoberto = u.rf_ativos.filter((a) => fgcLikelyCovered(a.n)).reduce((s, a) => s + a.v, 0);
  const soberano = u.rf_ativos.filter((a) => tesouroSoberano(a.n)).reduce((s, a) => s + a.v, 0);
  const descoberto = Math.max(0, u.total - fgcCoberto - soberano);
  const destinoConservador = 0.135;
  const destinoForte = carregoAlvo / 100;
  const rvCandidataNames = new Set(rvCandidata.map((a) => a.n));
  const rfParaReverNames = new Set(rfParaRever.map((a) => a.n));
  const carregoRF = u.rf_ativos.reduce((s, a) => s + a.v * taxaRFAnual(a, cdiRef), 0);
  const carregoRV = rv.reduce((s, a) => s + parseBRLText(a.v) * taxaRVReferencia(a), 0);
  const carregoRFRever = rfParaRever.reduce((s, a) => s + a.v * taxaRFAnual(a, cdiRef), 0);
  const carregoRVCandidata = rvCandidata.reduce((s, a) => s + parseBRLText(a.v) * taxaRVReferencia(a), 0);
  const carregoBlocoAtual = capitalGiro > 0 ? (carregoRFRever + carregoRVCandidata) / capitalGiro : 0;
  const capitalMedido = u.rf_ativos.reduce((s, a) => s + a.v, 0) + rv.reduce((s, a) => s + parseBRLText(a.v), 0);
  const carregoAtual = capitalMedido > 0 ? (carregoRF + carregoRV) / capitalMedido : 0;
  const ganhoAnoConservador = capitalGiro * (destinoConservador - carregoBlocoAtual / 100);
  const ganhoAnoForte = capitalGiro * (destinoForte - carregoBlocoAtual / 100);
  const carregoNaoMexidoValor = (carregoRF + carregoRV) - (carregoRFRever + carregoRVCandidata);
  const carregoComGiro = capitalMedido > 0
    ? (carregoNaoMexidoValor + capitalGiro * carregoAlvo) / capitalMedido
    : 0;
  const custoCarregoAtual = u.total * (carregoAtual / 100);
  const custoCarregoGiro = u.total * (carregoComGiro / 100);
  const rfNaoMexida10 = u.rf_ativos
    .filter((a) => !rfParaReverNames.has(a.n))
    .reduce((s, a) => s + projectedRF10(a), 0);
  const rfGiradaBase10 = rfParaRever.reduce((s, a) => s + projectedRF10(a), 0);
  const rvNaoMexida10 = rv
    .filter((a) => !rvCandidataNames.has(a.n))
    .reduce((s, a) => s + projectedRV10(parseBRLText(a.v)), 0);
  const rvGiradaBase10 = rvCandidata.reduce((s, a) => s + projectedRV10(parseBRLText(a.v)), 0);
  const patrimonioAtual10 = projectionBase10(u, profileId);
  const blocoBase10 = rfGiradaBase10 + rvGiradaBase10;
  const patrimonioGiro10 = patrimonioAtual10 - blocoBase10 + capitalGiro * Math.pow(1 + destinoForte, 10);
  const ganhoProjetado10 = patrimonioGiro10 - patrimonioAtual10;
  const taxaProjecaoPatrimonio = u.total > 0 ? (Math.pow(patrimonioAtual10 / u.total, 1 / 10) - 1) * 100 : 0;

  return (
    <>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Sugestão de giro simples <span>carrego, giro e patrimônio projetado</span>
        </div>
        <div className="card carrego-simulator" style={{ marginBottom: 14, background: "rgba(255,255,255,.62)" }}>
          <div className="card-hdr">
            Situação atual da carteira
          </div>
          <div className="kpi-row" style={{ marginBottom: 14 }}>
            <div className="kpi">
              <div className="kpi-l">Carrego atual</div>
              <div className={"kpi-v " + (carregoAtual < 10 ? "bad" : carregoAtual < 13.3 ? "warn" : "good")}>
                {carregoAtual.toFixed(2).replace(".", ",")}%
              </div>
              <div className="kpi-s">taxa média que a carteira gera hoje em juros + proventos</div>
            </div>
            <div className="kpi">
              <div className="kpi-l">Taxa de crescimento estimada</div>
              <div className="kpi-v good">{taxaProjecaoPatrimonio.toFixed(2).replace(".", ",")}%</div>
              <div className="kpi-s">projeção de crescimento real do patrimônio em 10 anos</div>
            </div>
            <div className="kpi">
              <div className="kpi-l">RV vs preço médio pago</div>
              <div className={"kpi-v " + (rvEconomia.delta < 0 ? "bad" : "good")}>
                {rvEconomia.delta >= 0 ? "+" : ""}{fmtRk(rvEconomia.delta)}
              </div>
              <div className="kpi-s">{rvEconomia.delta >= 0 ? "lucro latente na renda variável" : "perda latente na renda variável"}</div>
            </div>
            <div className="kpi">
              <div className="kpi-l">Patrimônio sem mexer em 10 anos</div>
              <div className="kpi-v">{fmtRk(patrimonioAtual10)}</div>
              <div className="kpi-s">se continuar como está hoje</div>
            </div>
          </div>

          <div className="card-hdr" style={{ marginBottom: 10 }}>
            Simulação de giro — meta de carrego <span>{carregoAlvo.toFixed(1).replace(".", ",")}% a.a.</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
            Arraste para simular: se os ativos candidatos fossem trocados por ativos que rendem {carregoAlvo.toFixed(1).replace(".", ",")}% ao ano, quanto a carteira ganharia?
          </div>
          <input
            type="range"
            min={9}
            max={20}
            step={0.25}
            value={carregoAlvo}
            onChange={(e) => setCarregoAlvo(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 4, marginBottom: 14 }}>
            <span>9% fraco</span>
            <span>13,3% = 90% CDI</span>
            <span>20% agressivo</span>
          </div>
          <div className="kpi-row" style={{ marginBottom: 0 }}>
            <div className="kpi">
              <div className="kpi-l">Carrego após giro</div>
              <div className="kpi-v good">{carregoComGiro.toFixed(2).replace(".", ",")}%</div>
              <div className="kpi-s">nova taxa média se fizer o giro</div>
            </div>
            <div className="kpi">
              <div className="kpi-l">Perda embutida no bloco a girar</div>
              <div className={"kpi-v " + (rvCandidataEconomia.delta < 0 ? "bad" : "good")}>
                {rvCandidataEconomia.delta >= 0 ? "+" : ""}{fmtRk(rvCandidataEconomia.delta)}
              </div>
              <div className="kpi-s">quanto os ativos candidatos estão abaixo do preço pago</div>
            </div>
            <div className="kpi">
              <div className="kpi-l">Patrimônio com giro em 10 anos</div>
              <div className="kpi-v good">{fmtRk(patrimonioGiro10)}</div>
              <div className="kpi-s">ganho adicional vs. não mexer: {ganhoProjetado10 >= 0 ? "+" : ""}{fmtRk(ganhoProjetado10)}</div>
            </div>
          </div>
        </div>
        <div className="g2" style={{ marginBottom: 14 }}>
          <div>
            <div className="aitem">
              <div className="dot dr" />
              <div>
                <div className="aitem-name">1. Listados/RV abaixo do corte entram para estudo</div>
                <div className="aitem-det">
                  Regra simples: RV abaixo do preço médio, tese ruim ou retorno claramente negativo vira candidata. A rentabilidade informada pela XP não é tratada como taxa anual.
                </div>
              </div>
            </div>
            <div className="aitem">
              <div className="dot dw" />
              <div>
                <div className="aitem-name">2. Não mexer automaticamente em Tesouro</div>
                <div className="aitem-det">Tesouro fica separado por ser risco soberano; a análise de FGC não mistura com LFT/NTN/LTN.</div>
              </div>
            </div>
            <div className="aitem">
              <div className="dot dg" />
              <div>
                <div className="aitem-name">3. Destino alvo: renda fixa limpa</div>
                <div className="aitem-det">LC/LCI/LCA com FGC, IPCA+ alto ou debênture isenta só se pagar prêmio real suficiente.</div>
              </div>
            </div>
          </div>
          <div>
            <div className="aitem">
              <div className="dot dw" />
              <div>
                <div className="aitem-name">Resumo da troca</div>
                <div className="aitem-det">
                  O bloco candidato gera renda recorrente estimada de {carregoBlocoAtual.toFixed(2).replace(".", ",")}% a.a., mas carrega {fmtBRL(Math.abs(rvCandidataEconomia.delta))} de perda contra PM na RV. Girar {fmtBRL(capitalGiro)} para {carregoAlvo.toFixed(1).replace(".", ",")}% a.a. adiciona cerca de {ganhoAnoForte >= 0 ? "+" : ""}{fmtBRL(ganhoAnoForte)}/ano antes de IR, custos e preço de execução.
                </div>
              </div>
            </div>
            <div className="aitem">
              <div className="dot dw" />
              <div>
                <div className="aitem-name">Cobertura e risco</div>
                <div className="aitem-det">
                  FGC provável: {fmtBRL(fgcCoberto)}. Sem FGC e sem Tesouro: {fmtBRL(descoberto)}. Tesouro separado para análise própria: {fmtBRL(soberano)}.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="g2" style={{ marginBottom: 14 }}>
          <div>
            <div className="card-hdr" style={{ marginBottom: 8 }}>Renda fixa para revisar</div>
            {rfParaRever.length === 0 ? (
              <div className="aitem"><div className="dot dg" /><div><div className="aitem-name">Nenhuma RF abaixo de 90% do CDI</div><div className="aitem-det">Não apareceu CDB/LC/LCI/LCA com taxa fraca pelo critério atual.</div></div></div>
            ) : rfParaRever.map((a) => (
              <div className="aitem" key={a.n}>
                <div className="dot dr" />
                <div>
                  <div className="aitem-name">{a.n}</div>
                  <div className="aitem-det">{fmtBRL(a.v)} · {rfTaxaLabel(a)} · venc. {a.venc || "a confirmar"} · comparar com FGC/IPCA+ melhor</div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="card-hdr" style={{ marginBottom: 8 }}>Tesouro / soberano</div>
            {tesouroParaRever.length === 0 ? (
              <div className="aitem"><div className="dot dw" /><div><div className="aitem-name">Sem Tesouro detectado</div><div className="aitem-det">Nada para comparar nessa carteira.</div></div></div>
            ) : tesouroParaRever.map((a) => (
              <div className="aitem" key={a.n}>
                <div className="dot dw" />
                <div>
                  <div className="aitem-name">{a.n}</div>
                  <div className="aitem-det">{fmtBRL(a.v)} · {rfTaxaLabel(a)} · olhar marcação a mercado, prazo e alternativa IPCA+/LC antes de mexer</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="g2" style={{ marginBottom: 0 }}>
          <div>
            <div className="card-hdr" style={{ marginBottom: 8 }}>RV / listados para estudar venda</div>
            {rvCandidata.length === 0 ? (
              <div className="aitem"><div className="dot dg" /><div><div className="aitem-name">Nenhum listado fraco detectado</div><div className="aitem-det">A carteira não mostrou ações, FIIs, ETFs ou fundos listados abaixo do corte.</div></div></div>
            ) : rvCandidata.map((a) => (
              <div className="aitem" key={a.n}>
                <div className={"dot d" + (a.rc === "bad" ? "r" : "w")} />
                <div>
                  <div className="aitem-name">{a.n}</div>
                  <div className="aitem-det">
                    {a.v} · {(() => {
                      const e = rvEconomiaPM(a);
                      return e.delta === null
                        ? "PM/cotação a confirmar"
                        : `vs PM ${e.delta >= 0 ? "+" : ""}${fmtBRL(e.delta)}${e.deltaPct !== null ? ` (${e.deltaPct.toFixed(1).replace(".", ",")}%)` : ""}`;
                    })()} · {stripImportadoXP(a.pm)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="card-hdr" style={{ marginBottom: 8 }}>Resposta sugerida</div>
            <div className="aitem"><div className="dot dg" /><div><div className="aitem-name">LC/LCI/LCA até limite FGC</div><div className="aitem-det">Usar por emissor até R$250k por CPF quando o risco for bancário e o prazo fizer sentido.</div></div></div>
            <div className="aitem"><div className="dot dw" /><div><div className="aitem-name">IPCA+ alto para prazo médio</div><div className="aitem-det">Travar poder de compra se aparecer IPCA+7,5%/8% com emissor e liquidez aceitáveis.</div></div></div>
            <div className="aitem"><div className="dot dw" /><div><div className="aitem-name">Debênture incentivada só com prêmio real</div><div className="aitem-det">Sem FGC: precisa pagar bastante mais que alternativa bancária/Tesouro para justificar.</div></div></div>
            <div className="aitem"><div className="dot dg" /><div><div className="aitem-name">Breakeven estimado</div><div className="aitem-det">Ganho anual entre +{fmtRk(ganhoAnoConservador)} e +{fmtRk(ganhoAnoForte)}, antes de IR/custos/slippage.</div></div></div>
          </div>
        </div>
      </div>
    </>
  );
}

function BreakevenTabs({ profileId }: { profileId: ProfileId }) {
  const [tab, setTab] = useState<"sugestao" | "oportunidade" | "giros" | "aporte">("sugestao");
  const tabBtn = (id: "oportunidade" | "sugestao" | "giros" | "aporte", label: string) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: "7px 16px", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit",
        border: "1px solid var(--border)", borderBottom: "none",
        borderRadius: "9px 9px 0 0", letterSpacing: ".01em",
        background: tab === id ? "var(--card)" : "transparent",
        color: tab === id ? "var(--foreground)" : "var(--muted-foreground)",
        fontWeight: tab === id ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
  return (
    <>
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 18 }}>
        {tabBtn("sugestao", "Giro + carrego")}
        {tabBtn("oportunidade", "Custo de oportunidade")}
        {tabBtn("giros", "Giros & plano")}
        {tabBtn("aporte", "Acelerar com aporte")}
      </div>
      {tab === "sugestao" && <SugestaoGiroCarteira profileId={profileId} />}
      {tab === "oportunidade" && <OportunidadePage profileId={profileId} />}
      {tab === "giros" && (
        <>
          <GirosRegistradosPanel />
          <BreakevenPage profileId={profileId} />
        </>
      )}
      {tab === "aporte" && <AportePage />}
    </>
  );
}


