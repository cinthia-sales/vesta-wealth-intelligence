import { useMemo, useState } from "react";
import {
  Home,
  Wallet,
  Bell,
  CalendarClock,
  Target,
  Scale,
  ArrowLeftRight,
  Lock,
  Users,
  Rocket,
  Upload,
  Settings,
  ChevronDown,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

import { formatBRL } from "@/data/profiles";
import { getProfileView, type ProfileId } from "@/lib/profile-derive";
import { Temple, Goddess, Wheat, Amphora, Flame, Divider } from "./ornaments";

// ─── Profile Selector (tela inicial) ─────────────────────────────────────

const PROFILE_CARDS: { id: ProfileId; title: string; subtitle: string; symbol: "rose" | "copper" | "gold" }[] = [
  { id: "cinthia", title: "Cinthia", subtitle: "Visão individual", symbol: "rose" },
  { id: "paulo", title: "Paulo", subtitle: "Visão individual", symbol: "copper" },
  { id: "familiar", title: "Família", subtitle: "Visão consolidada", symbol: "gold" },
];

export function ProfileSelector({ onSelect }: { onSelect: (id: ProfileId) => void }) {
  return (
    <div className="min-h-screen w-full bg-[var(--color-vesta-sand)] text-foreground">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
        <div className="relative mb-10 flex flex-col items-center text-center">
          <Goddess className="pointer-events-none absolute -top-8 left-1/2 h-40 w-40 -translate-x-1/2 text-[var(--color-vesta-copper)] opacity-10" />
          <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--color-vesta-copper)]">
            Guardiã do Patrimônio
          </p>
          <h1 className="mt-3 font-serif text-6xl tracking-[0.15em] text-[var(--color-vesta-night)]">
            VESTA
          </h1>
          <Divider className="mt-4 h-3 w-40 text-[var(--color-vesta-copper)] opacity-70" />
          <p className="mt-4 max-w-md font-serif italic text-[var(--color-vesta-petrol)]">
            Lar, proteção, estratégia e prosperidade em harmonia.
          </p>
        </div>

        <p className="mb-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Selecione um perfil
        </p>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          {PROFILE_CARDS.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="group relative overflow-hidden rounded-2xl border border-[var(--color-vesta-copper)]/25 bg-card px-6 py-8 text-left shadow-[0_1px_0_rgba(31,58,82,0.05),0_20px_40px_-30px_rgba(31,58,82,0.35)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-vesta-copper)]/50 hover:shadow-[0_1px_0_rgba(31,58,82,0.06),0_30px_50px_-30px_rgba(31,58,82,0.45)]"
            >
              <div className="absolute -right-4 -bottom-4 opacity-[0.08] transition-opacity group-hover:opacity-[0.14]">
                {c.symbol === "rose" && <Amphora className="h-40 w-28 text-[var(--color-vesta-rose-burnt)]" />}
                {c.symbol === "copper" && <Temple className="h-40 w-40 text-[var(--color-vesta-copper)]" />}
                {c.symbol === "gold" && <Wheat className="h-40 w-20 text-[var(--color-vesta-gold)]" />}
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-vesta-copper)]">
                Perfil
              </p>
              <h2 className="mt-2 font-serif text-3xl text-[var(--color-vesta-night)]">{c.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{c.subtitle}</p>
              <div className="mt-8 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-vesta-petrol)]">
                Entrar <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          ))}
        </div>

        <p className="mt-12 max-w-md text-center font-serif italic text-sm text-muted-foreground">
          “Cuidar do lar é cuidar do futuro. Cuidar do patrimônio é cuidar de todos que amamos.”
        </p>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────

type NavKey =
  | "visao"
  | "posicao"
  | "alertas"
  | "vencimentos"
  | "breakeven"
  | "equivalencia"
  | "validador"
  | "regras"
  | "influenciadores"
  | "acelerar"
  | "importar"
  | "config";

const NAV: { key: NavKey; label: string; icon: React.ComponentType<{ className?: string }>; migrated: boolean; hash?: string }[] = [
  { key: "visao", label: "Visão Geral", icon: Home, migrated: true },
  { key: "posicao", label: "Posição Atual", icon: Wallet, migrated: false, hash: "posicao" },
  { key: "alertas", label: "Alertas", icon: Bell, migrated: true },
  { key: "vencimentos", label: "Vencimentos", icon: CalendarClock, migrated: true },
  { key: "breakeven", label: "Breakeven", icon: Target, migrated: false, hash: "breakeven" },
  { key: "equivalencia", label: "Equivalência de Taxas", icon: Scale, migrated: false, hash: "equivalencia" },
  { key: "validador", label: "Validador de Troca", icon: ArrowLeftRight, migrated: false, hash: "validador" },
  { key: "regras", label: "Regras – não mexer", icon: Lock, migrated: false, hash: "regras" },
  { key: "influenciadores", label: "Influenciadores", icon: Users, migrated: false, hash: "drivers" },
  { key: "acelerar", label: "Acelerar Breakeven", icon: Rocket, migrated: false, hash: "aporte" },
  { key: "importar", label: "Importar Arquivos XP", icon: Upload, migrated: false, hash: "importar" },
  { key: "config", label: "Configurações", icon: Settings, migrated: false, hash: "config" },
];

function Sidebar({
  activeKey,
  onNav,
  profileId,
  onSwitchProfile,
}: {
  activeKey: NavKey;
  onNav: (k: NavKey) => void;
  profileId: ProfileId;
  onSwitchProfile: () => void;
}) {
  const profileLabel = profileId === "cinthia" ? "Cinthia" : profileId === "paulo" ? "Paulo" : "Família";

  return (
    <aside className="relative flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="relative px-6 pt-8 pb-6 text-center">
        <Flame className="pointer-events-none absolute left-1/2 top-2 h-8 w-8 -translate-x-1/2 text-[var(--color-vesta-gold)] opacity-80" />
        <h1 className="mt-6 font-serif text-2xl tracking-[0.25em] text-[var(--color-vesta-gold)]">VESTA</h1>
        <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-sidebar-foreground/70">
          Guardiã do Patrimônio
        </p>
      </div>

      <button
        onClick={onSwitchProfile}
        className="mx-4 mb-4 flex items-center justify-between rounded-lg border border-sidebar-border/60 bg-sidebar-accent/40 px-3 py-2 text-left transition-colors hover:bg-sidebar-accent"
      >
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-sidebar-foreground/60">Perfil ativo</p>
          <p className="mt-0.5 text-sm text-sidebar-foreground">{profileLabel}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
      </button>

      <nav className="flex-1 space-y-0.5 px-3 pb-4">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = activeKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNav(item.key)}
              className={
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors " +
                (active
                  ? "bg-[var(--color-vesta-sand)] text-[var(--color-vesta-night)] shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="relative mx-4 mb-6 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/30 px-4 py-4 text-center">
        <Wheat className="pointer-events-none absolute -top-4 left-1/2 h-8 w-4 -translate-x-1/2 text-[var(--color-vesta-gold)] opacity-70" />
        <p className="font-serif text-xs italic leading-relaxed text-sidebar-foreground/80">
          Cuidar do lar é cuidar do futuro. Cuidar do patrimônio é cuidar de todos que amamos.
        </p>
      </div>
    </aside>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────

function Header({ subtitle }: { subtitle: string }) {
  return (
    <header className="relative overflow-hidden border-b border-border bg-[var(--color-vesta-sand)]">
      <Goddess className="pointer-events-none absolute -left-6 top-2 h-40 w-40 text-[var(--color-vesta-copper)] opacity-[0.07]" />
      <Temple className="pointer-events-none absolute right-8 top-4 h-24 w-24 text-[var(--color-vesta-copper)] opacity-[0.08]" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-8 py-8 text-center">
        <h1 className="font-serif text-4xl tracking-[0.2em] text-[var(--color-vesta-night)]">VESTA</h1>
        <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-[var(--color-vesta-copper)]">
          Guardiã do Patrimônio
        </p>
        <Divider className="mt-3 h-3 w-32 text-[var(--color-vesta-copper)] opacity-70" />
        <p className="mt-3 font-serif italic text-sm text-[var(--color-vesta-petrol)]">
          Lar, proteção, estratégia e prosperidade em harmonia.
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">{subtitle}</p>
      </div>
    </header>
  );
}

// ─── Visão Geral ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  hint,
  ornament,
}: {
  label: string;
  value: string;
  hint?: string;
  ornament?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[0_20px_40px_-30px_rgba(31,58,82,0.3)]">
      <div className="pointer-events-none absolute -right-4 -bottom-4 opacity-[0.08]">{ornament}</div>
      <p className="font-serif text-lg text-[var(--color-vesta-night)]">{label}</p>
      <p className="mt-4 font-serif text-3xl text-[var(--color-vesta-night)]">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function VisaoGeral({ profileId }: { profileId: ProfileId }) {
  const view = useMemo(() => getProfileView(profileId), [profileId]);
  const { totals } = view;
  const rfPct = totals.total > 0 ? (totals.rf / totals.total) * 100 : 0;
  const rvPct = totals.total > 0 ? (totals.rv / totals.total) * 100 : 0;

  const urgentCount = view.alerts.filter((a) => a.level === "urgent").length;
  const warnCount = view.alerts.filter((a) => a.level === "warn").length;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-[var(--color-vesta-night)]">
            Visão Geral{" "}
            <span className="text-sm font-normal text-[var(--color-vesta-copper)]">
              · {view.subtitle}
            </span>
          </h2>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs uppercase tracking-widest text-[var(--color-vesta-petrol)] transition-colors hover:bg-muted">
          Atualizar <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Patrimônio Total"
          value={formatBRL(totals.total)}
          hint={view.isFamily ? "Cinthia + Paulo consolidado" : `Perfil ${view.name}`}
          ornament={<Temple className="h-32 w-32 text-[var(--color-vesta-copper)]" />}
        />
        <StatCard
          label="Renda Fixa"
          value={`${rfPct.toFixed(1)}%`}
          hint={formatBRL(totals.rf)}
          ornament={<Wheat className="h-32 w-16 text-[var(--color-vesta-gold)]" />}
        />
        <StatCard
          label="Renda Variável"
          value={`${rvPct.toFixed(1)}%`}
          hint={formatBRL(totals.rv)}
          ornament={<Amphora className="h-32 w-24 text-[var(--color-vesta-rose-burnt)]" />}
        />
        <StatCard
          label="Alertas ativos"
          value={String(view.alerts.length)}
          hint={`${urgentCount} urgente(s) · ${warnCount} atenção`}
          ornament={<Flame className="h-32 w-24 text-[var(--color-vesta-copper)]" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AlertasRecentes profileId={profileId} />
        <ProximosVencimentos profileId={profileId} />
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-8 py-8">
        <Wheat className="pointer-events-none absolute -left-4 -bottom-6 h-32 w-16 text-[var(--color-vesta-gold)] opacity-10" />
        <Goddess className="pointer-events-none absolute right-4 top-2 h-28 w-28 text-[var(--color-vesta-copper)] opacity-[0.07]" />
        <p className="font-serif text-xl italic leading-relaxed text-[var(--color-vesta-petrol)]">
          Cada decisão consciente hoje acende a segurança do amanhã.
        </p>
      </div>
    </section>
  );
}

// ─── Alertas / Vencimentos ───────────────────────────────────────────────

const levelBadge: Record<string, string> = {
  urgent: "bg-[var(--color-vesta-rose)] text-[var(--color-vesta-night)]",
  warn: "bg-[var(--color-vesta-gold)]/40 text-[var(--color-vesta-night)]",
  ok: "bg-[var(--color-vesta-ivory)] text-[var(--color-vesta-petrol)]",
};

function AlertasRecentes({ profileId }: { profileId: ProfileId }) {
  const view = getProfileView(profileId);
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-lg text-[var(--color-vesta-night)]">Alertas Recentes</h3>
        <Bell className="h-4 w-4 text-[var(--color-vesta-copper)]" />
      </div>
      {view.alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem alertas registrados.</p>
      ) : (
        <ul className="space-y-3">
          {view.alerts.slice(0, 6).map((a, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className={
                  "mt-0.5 rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider " +
                  (levelBadge[a.level] ?? levelBadge.ok)
                }
              >
                {a.level === "urgent" ? "Urgente" : a.level === "warn" ? "Atenção" : "OK"}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-foreground">{a.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{a.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProximosVencimentos({ profileId }: { profileId: ProfileId }) {
  const view = getProfileView(profileId);
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-lg text-[var(--color-vesta-night)]">Próximos Vencimentos</h3>
        <CalendarClock className="h-4 w-4 text-[var(--color-vesta-copper)]" />
      </div>
      {view.maturities.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem vencimentos registrados.</p>
      ) : (
        <ul className="divide-y divide-border">
          {view.maturities.slice(0, 8).map((m, i) => (
            <li key={i} className="flex items-center justify-between py-2.5 text-sm">
              <div className="min-w-0 pr-3">
                <p className="truncate text-foreground">{m.name}</p>
                {m.note && (
                  <p className="text-[11px] uppercase tracking-wider text-[var(--color-vesta-copper)]">
                    {m.note}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{m.date}</p>
                <p className="font-serif text-sm text-[var(--color-vesta-night)]">{formatBRL(m.value)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Legacy fallback via iframe (para módulos ainda não migrados) ───────

function LegacyFallback({ hash, label }: { hash: string; label: string }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-[var(--color-vesta-night)]">{label}</h2>
        <span className="text-[10px] uppercase tracking-widest text-[var(--color-vesta-copper)]">
          Módulo em migração · versão de referência
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <iframe
          key={hash}
          src={`/vesta.html#${hash}`}
          title={label}
          className="h-[75vh] w-full border-0"
        />
      </div>
    </section>
  );
}

// ─── Shell ───────────────────────────────────────────────────────────────

export function VestaShell({
  profileId,
  onSwitchProfile,
}: {
  profileId: ProfileId;
  onSwitchProfile: () => void;
}) {
  const [nav, setNav] = useState<NavKey>("visao");
  const view = getProfileView(profileId);

  const renderMain = () => {
    if (nav === "visao") return <VisaoGeral profileId={profileId} />;
    if (nav === "alertas")
      return (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-[var(--color-vesta-night)]">Alertas</h2>
          <AlertasRecentes profileId={profileId} />
        </section>
      );
    if (nav === "vencimentos")
      return (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-[var(--color-vesta-night)]">Vencimentos</h2>
          <ProximosVencimentos profileId={profileId} />
        </section>
      );
    const item = NAV.find((n) => n.key === nav);
    return <LegacyFallback hash={item?.hash ?? ""} label={item?.label ?? ""} />;
  };

  return (
    <div className="flex min-h-screen w-full bg-[var(--color-vesta-sand)]">
      <Sidebar activeKey={nav} onNav={setNav} profileId={profileId} onSwitchProfile={onSwitchProfile} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header subtitle={view.subtitle} />
        <main className="flex-1 px-6 py-8 md:px-10">
          <div className="mx-auto w-full max-w-6xl">{renderMain()}</div>
        </main>
      </div>
    </div>
  );
}
