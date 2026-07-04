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
  LogOut,
  Check,
  Calculator,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { formatBRL } from "@/data/profiles";
import { getProfileView, type ProfileId } from "@/lib/profile-derive";
import { Temple, Goddess, Wheat, Amphora, Flame, Divider, Shield, Branch } from "./ornaments";

// ─── Profile Selector (tela inicial) ─────────────────────────────────────

const PROFILE_CARDS: {
  id: ProfileId;
  title: string;
  subtitle: string;
  symbol: "temple" | "amphora" | "wheat";
}[] = [
  { id: "familiar", title: "Família", subtitle: "Visão consolidada", symbol: "temple" },
  { id: "paulo", title: "Paulo", subtitle: "Visão individual", symbol: "amphora" },
  { id: "cinthia", title: "Cinthia", subtitle: "Visão individual", symbol: "wheat" },
];

function TopSymbolPillar({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      title={hint}
      className="group flex flex-col items-center gap-1.5 px-2 text-[var(--color-vesta-copper)] transition-colors hover:text-[var(--color-vesta-night)]"
    >
      <div className="opacity-80 transition-opacity group-hover:opacity-100">{icon}</div>
      <span className="text-[9px] uppercase tracking-[0.28em] text-[var(--color-vesta-petrol)]/75 group-hover:text-[var(--color-vesta-night)]">
        {label}
      </span>
    </button>
  );
}

export function ProfileSelector({ onSelect }: { onSelect: (id: ProfileId) => void }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[var(--color-vesta-sand)] text-foreground">
      {/* Deusa Vesta — canto superior esquerdo, saindo da tela */}
      <Goddess className="pointer-events-none absolute -left-24 -top-10 h-[520px] w-[520px] text-[var(--color-vesta-copper)] opacity-[0.06]" />
      {/* Ramos laterais */}
      <Branch className="pointer-events-none absolute -right-16 top-16 h-[520px] w-[220px] text-[var(--color-vesta-copper)] opacity-[0.08]" />
      <Branch className="pointer-events-none absolute -left-24 bottom-0 h-[380px] w-[180px] rotate-[8deg] text-[var(--color-vesta-copper)] opacity-[0.05]" />

      {/* Header: VESTA centralizado + símbolos à direita */}
      <header className="relative mx-auto flex max-w-6xl items-start justify-between px-8 pt-10">
        <div className="w-40" />
        <div className="flex flex-col items-center text-center">
          <Flame className="h-8 w-8 text-[var(--color-vesta-copper)] opacity-90" />
          <p className="mt-1 text-[10px] uppercase tracking-[0.42em] text-[var(--color-vesta-copper)]">
            Guardiã do Patrimônio
          </p>
          <h1 className="mt-2 font-serif text-[64px] leading-none tracking-[0.22em] text-[var(--color-vesta-night)]">
            VESTA
          </h1>
          <Divider className="mt-4 h-3 w-48 text-[var(--color-vesta-copper)] opacity-70" />
          <p className="mt-3 max-w-md font-serif italic text-[var(--color-vesta-petrol)]">
            Lar, proteção, estratégia e prosperidade em harmonia.
          </p>
        </div>
        <div className="hidden w-40 items-start justify-end gap-4 pt-2 md:flex">
          <TopSymbolPillar
            icon={<Temple className="h-9 w-9" />}
            label="Estratégia"
            hint="Estratégia · Simuladores"
          />
          <TopSymbolPillar
            icon={<Shield className="h-9 w-8" />}
            label="Proteção"
            hint="Proteção · Alertas e riscos"
          />
          <TopSymbolPillar
            icon={<Wheat className="h-9 w-5" />}
            label="Prosperidade"
            hint="Prosperidade · Metas e crescimento"
          />
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-8 pb-16 pt-14">
        <p className="mb-8 text-center text-[11px] uppercase tracking-[0.42em] text-[var(--color-vesta-copper)]">
          Selecione um perfil
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PROFILE_CARDS.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="group relative overflow-hidden rounded-[18px] border border-[var(--color-vesta-copper)]/25 bg-[var(--color-vesta-ivory)] px-7 py-8 text-left shadow-[0_8px_24px_rgba(31,58,82,0.06)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-vesta-copper)]/60 hover:shadow-[0_16px_36px_rgba(31,58,82,0.12)]"
            >
              <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-vesta-copper)]">
                Perfil
              </p>
              <h2 className="mt-3 font-serif text-[38px] leading-none text-[var(--color-vesta-night)]">
                {c.title}
              </h2>
              <p className="mt-2 text-[13px] text-[var(--color-vesta-petrol)]/80">{c.subtitle}</p>

              <div className="pointer-events-none absolute right-4 bottom-16 opacity-70 transition-opacity group-hover:opacity-95">
                {c.symbol === "temple" && (
                  <Temple className="h-24 w-28 text-[var(--color-vesta-copper)]" />
                )}
                {c.symbol === "amphora" && (
                  <Amphora className="h-28 w-20 text-[var(--color-vesta-copper)]" />
                )}
                {c.symbol === "wheat" && (
                  <Wheat className="h-28 w-14 text-[var(--color-vesta-copper)]" />
                )}
              </div>

              <div className="relative z-10 mt-24 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--color-vesta-copper)]">
                Entrar
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>

        {/* Rodapé: frase pequena, elegante, com divisor cobre — sem vela chamativa */}
        <div className="mx-auto mt-16 flex max-w-2xl flex-col items-center text-center">
          <Divider className="h-2 w-40 text-[var(--color-vesta-copper)] opacity-60" />
          <p className="mt-4 font-serif text-[13px] italic leading-relaxed text-[var(--color-vesta-petrol)]/80">
            "Cuidar do lar é cuidar do futuro. Cuidar do patrimônio é cuidar de todos que amamos."
          </p>
        </div>
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

const NAV: {
  key: NavKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  migrated: boolean;
  hash?: string;
}[] = [
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

const PROFILE_LABEL: Record<ProfileId, string> = {
  cinthia: "Cinthia",
  paulo: "Paulo",
  familiar: "Família",
};

function ProfileSwitcher({
  profileId,
  onChange,
}: {
  profileId: ProfileId;
  onChange: (id: ProfileId) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative mx-4 mb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-sidebar-border/60 bg-[color-mix(in_oklab,var(--color-vesta-night)_55%,black)] px-3 py-2.5 text-left transition-colors hover:border-[var(--color-vesta-gold)]/40"
      >
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.25em] text-sidebar-foreground/60">
            Perfil ativo
          </p>
          <p className="mt-0.5 truncate font-serif text-base text-sidebar-foreground">
            {PROFILE_LABEL[profileId]}
          </p>
        </div>
        <ChevronDown
          className={
            "h-4 w-4 shrink-0 text-sidebar-foreground/60 transition-transform " +
            (open ? "rotate-180" : "")
          }
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-lg border border-sidebar-border/60 bg-[color-mix(in_oklab,var(--color-vesta-night)_65%,black)] shadow-2xl">
          {(["cinthia", "paulo", "familiar"] as ProfileId[]).map((id) => {
            const active = id === profileId;
            return (
              <button
                key={id}
                onClick={() => {
                  onChange(id);
                  setOpen(false);
                }}
                className={
                  "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors " +
                  (active
                    ? "bg-[var(--color-vesta-gold)]/10 text-[var(--color-vesta-gold)]"
                    : "text-sidebar-foreground/85 hover:bg-white/5")
                }
              >
                <span className="font-serif">{PROFILE_LABEL[id]}</span>
                {active && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Sidebar({
  activeKey,
  onNav,
  profileId,
  onChangeProfile,
  onSwitchProfile,
}: {
  activeKey: NavKey;
  onNav: (k: NavKey) => void;
  profileId: ProfileId;
  onChangeProfile: (id: ProfileId) => void;
  onSwitchProfile: () => void;
}) {
  return (
    <aside className="relative flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      {/* subtle vertical ornament */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[var(--color-vesta-gold)]/30 to-transparent" />

      <div className="relative px-6 pt-7 pb-5 text-center">
        <Flame className="pointer-events-none absolute left-1/2 top-1 h-7 w-7 -translate-x-1/2 text-[var(--color-vesta-gold)] opacity-90" />
        <h1 className="mt-5 font-serif text-2xl tracking-[0.3em] text-[var(--color-vesta-gold)]">
          VESTA
        </h1>
        <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-sidebar-foreground/60">
          Guardiã do Patrimônio
        </p>
        <Divider className="mx-auto mt-3 h-2 w-20 text-[var(--color-vesta-gold)] opacity-60" />
      </div>

      <ProfileSwitcher profileId={profileId} onChange={onChangeProfile} />

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = activeKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNav(item.key)}
              className={
                "relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors " +
                (active
                  ? "bg-[var(--color-vesta-sand)] text-[var(--color-vesta-night)] shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-sidebar-foreground")
              }
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[var(--color-vesta-gold)]" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        onClick={onSwitchProfile}
        className="mx-4 mt-2 mb-3 flex items-center justify-center gap-2 rounded-lg border border-sidebar-border/40 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-sidebar-foreground/70 transition-colors hover:border-[var(--color-vesta-gold)]/40 hover:text-[var(--color-vesta-gold)]"
      >
        <LogOut className="h-3.5 w-3.5" /> Tela inicial
      </button>

      <div className="relative mx-4 mb-5 rounded-lg border border-sidebar-border/40 bg-[color-mix(in_oklab,var(--color-vesta-night)_55%,black)] px-4 py-4 text-center">
        <Wheat className="pointer-events-none absolute -top-4 left-1/2 h-8 w-4 -translate-x-1/2 text-[var(--color-vesta-gold)] opacity-70" />
        <p className="font-serif text-[11px] italic leading-relaxed text-sidebar-foreground/75">
          Cuidar do lar é cuidar do futuro. Cuidar do patrimônio é cuidar de todos que amamos.
        </p>
      </div>
    </aside>
  );
}

// ─── Top Banner ──────────────────────────────────────────────────────────

function TopBanner() {
  return (
    <div className="relative overflow-hidden border-b border-[var(--color-vesta-copper)]/20 bg-[color-mix(in_oklab,var(--color-vesta-sand)_92%,var(--color-vesta-copper)_8%)]">
      <Goddess className="pointer-events-none absolute -left-12 -top-4 h-56 w-56 text-[var(--color-vesta-copper)] opacity-[0.07]" />
      <Branch className="pointer-events-none absolute -right-6 -top-2 h-40 w-24 text-[var(--color-vesta-copper)] opacity-[0.06]" />
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
        <div className="w-56" />
        <div className="flex flex-col items-center text-center">
          <h1 className="font-serif text-3xl tracking-[0.28em] text-[var(--color-vesta-night)]">
            VESTA
          </h1>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.35em] text-[var(--color-vesta-copper)]">
            Guardiã do Patrimônio
          </p>
          <Divider className="mt-2 h-2 w-28 text-[var(--color-vesta-copper)] opacity-70" />
          <p className="mt-2 font-serif text-[13px] italic text-[var(--color-vesta-petrol)]">
            Lar, proteção, estratégia e prosperidade em harmonia.
          </p>
        </div>
        <div className="hidden w-56 items-start justify-end gap-5 md:flex">
          <Pillar icon={<Temple className="h-8 w-9" />} label="Estratégia" title="Estratégia · Simuladores" />
          <Pillar icon={<Shield className="h-8 w-7" />} label="Proteção" title="Proteção · Alertas e riscos" />
          <Pillar icon={<Wheat className="h-8 w-5" />} label="Prosperidade" title="Prosperidade · Metas" />
        </div>
      </div>
    </div>
  );
}

function Pillar({ icon, label, title }: { icon: React.ReactNode; label: string; title?: string }) {
  return (
    <button
      title={title}
      className="group flex flex-col items-center gap-1 text-[var(--color-vesta-copper)] transition-colors hover:text-[var(--color-vesta-night)]"
    >
      <div className="opacity-80 transition-opacity group-hover:opacity-100">{icon}</div>
      <span className="text-[9px] uppercase tracking-[0.3em] text-[var(--color-vesta-petrol)]/80 group-hover:text-[var(--color-vesta-night)]">
        {label}
      </span>
    </button>

  );
}

// ─── Section header (in content) ─────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="flex items-baseline gap-3">
        <h2 className="font-serif text-[26px] leading-none text-[var(--color-vesta-night)]">
          {title}
        </h2>
        <span className="text-[13px] text-[var(--color-vesta-rose-burnt)]">· {subtitle}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Atualizado em 24/05/2025
        </span>
        <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-vesta-copper)]/30 bg-card px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--color-vesta-petrol)] transition-colors hover:border-[var(--color-vesta-copper)]/60">
          Atualizar <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  hint,
  ornament,
  emphasis,
}: {
  label: string;
  value: string;
  hint?: string;
  ornament?: React.ReactNode;
  emphasis?: "primary" | "gold" | "rose" | "copper";
}) {
  const valueColor =
    emphasis === "gold"
      ? "text-[var(--color-vesta-copper)]"
      : emphasis === "rose"
        ? "text-[var(--color-vesta-rose-burnt)]"
        : "text-[var(--color-vesta-night)]";
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--color-vesta-copper)]/15 bg-card px-5 py-4 shadow-[0_1px_0_rgba(31,58,82,0.04),0_18px_36px_-28px_rgba(31,58,82,0.35)]">
      <div className="pointer-events-none absolute -right-3 -bottom-4 opacity-[0.09]">
        {ornament}
      </div>
      <p className="font-serif text-[15px] text-[var(--color-vesta-night)]/85">{label}</p>
      <p className={"mt-2 font-serif text-[28px] leading-tight " + valueColor}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Visão Geral ─────────────────────────────────────────────────────────

function VisaoGeral({ profileId }: { profileId: ProfileId }) {
  const view = useMemo(() => getProfileView(profileId), [profileId]);
  const { totals } = view;
  const rfPct = totals.total > 0 ? (totals.rf / totals.total) * 100 : 0;
  const rvPct = totals.total > 0 ? (totals.rv / totals.total) * 100 : 0;

  const urgentCount = view.alerts.filter((a) => a.level === "urgent").length;
  const warnCount = view.alerts.filter((a) => a.level === "warn").length;

  // Distribuição por classe
  const byClass = view.holdings.reduce<Record<string, number>>((acc, h) => {
    acc[h.klass] = (acc[h.klass] ?? 0) + h.value;
    return acc;
  }, {});
  const classes: { key: string; label: string; color: string }[] = [
    { key: "RF", label: "Renda Fixa", color: "var(--color-vesta-night)" },
    { key: "NTN", label: "Títulos Públicos", color: "var(--color-vesta-petrol)" },
    { key: "RV", label: "Ações", color: "var(--color-vesta-rose-burnt)" },
    { key: "FII", label: "Fundos Imob.", color: "var(--color-vesta-copper)" },
    { key: "ETF", label: "ETFs", color: "var(--color-vesta-gold)" },
  ];
  const distTotal = Object.values(byClass).reduce((s, v) => s + v, 0) || 1;

  return (
    <section className="space-y-5">
      <SectionHeader title="Visão Geral" subtitle={view.subtitle} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Patrimônio Total"
          value={formatBRL(totals.total)}
          hint={view.isFamily ? "Cinthia + Paulo consolidado" : `Perfil ${view.name}`}
          ornament={<Temple className="h-28 w-28 text-[var(--color-vesta-copper)]" />}
        />
        <StatCard
          label="Renda Fixa"
          value={`${rfPct.toFixed(1)}%`}
          hint={formatBRL(totals.rf)}
          ornament={<Wheat className="h-28 w-14 text-[var(--color-vesta-gold)]" />}
          emphasis="gold"
        />
        <StatCard
          label="Renda Variável"
          value={`${rvPct.toFixed(1)}%`}
          hint={formatBRL(totals.rv)}
          ornament={<Amphora className="h-28 w-20 text-[var(--color-vesta-rose-burnt)]" />}
          emphasis="rose"
        />
        <StatCard
          label="Alertas ativos"
          value={String(view.alerts.length)}
          hint={`${urgentCount} urgente(s) · ${warnCount} atenção`}
          ornament={<Flame className="h-28 w-20 text-[var(--color-vesta-copper)]" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Distribuição por Classe */}
        <div className="relative overflow-hidden rounded-xl border border-[var(--color-vesta-copper)]/15 bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-serif text-[16px] text-[var(--color-vesta-night)]">
              Distribuição por Classe
            </h3>
            <TrendingUp className="h-4 w-4 text-[var(--color-vesta-copper)]" />
          </div>
          <ul className="space-y-2.5">
            {classes.map((c) => {
              const v = byClass[c.key] ?? 0;
              const pct = (v / distTotal) * 100;
              if (v === 0) return null;
              return (
                <li key={c.key} className="text-[12px]">
                  <div className="flex items-baseline justify-between">
                    <span className="text-foreground/85">{c.label}</span>
                    <span className="font-serif text-[13px] text-[var(--color-vesta-night)]">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-vesta-ivory)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: c.color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <AlertasRecentes profileId={profileId} />
        <ProximosVencimentos profileId={profileId} />
      </div>

      {/* Frase inspiracional com ornamentos */}
      <div className="relative overflow-hidden rounded-xl border border-[var(--color-vesta-copper)]/15 bg-[color-mix(in_oklab,var(--color-vesta-ivory)_70%,var(--color-vesta-sand)_30%)] px-8 py-5">
        <Wheat className="pointer-events-none absolute -left-4 -bottom-6 h-28 w-14 text-[var(--color-vesta-gold)] opacity-[0.18]" />
        <Amphora className="pointer-events-none absolute right-6 -bottom-4 h-24 w-16 text-[var(--color-vesta-rose-burnt)] opacity-[0.15]" />
        <Goddess className="pointer-events-none absolute right-1/3 -top-4 h-24 w-24 text-[var(--color-vesta-copper)] opacity-[0.07]" />
        <p className="relative font-serif text-[18px] italic leading-relaxed text-[var(--color-vesta-petrol)]">
          Cada decisão consciente hoje acende a segurança do amanhã.
        </p>
      </div>

      {/* Ações Rápidas */}
      <div>
        <h3 className="mb-3 font-serif text-[16px] text-[var(--color-vesta-night)]">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <QuickAction icon={<Scale className="h-4 w-4" />} label="Equivalência" />
          <QuickAction icon={<ShieldCheck className="h-4 w-4" />} label="Validador" />
          <QuickAction icon={<Target className="h-4 w-4" />} label="Breakeven" />
          <QuickAction icon={<Calculator className="h-4 w-4" />} label="Aporte" />
          <QuickAction icon={<Upload className="h-4 w-4" />} label="Importar XP" />
        </div>
      </div>
    </section>
  );
}

function QuickAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-vesta-copper)]/20 bg-card px-4 py-3 text-[12px] text-[var(--color-vesta-petrol)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-vesta-copper)]/50 hover:shadow-[0_10px_20px_-14px_rgba(31,58,82,0.35)]">
      <span className="text-[var(--color-vesta-copper)]">{icon}</span>
      <span className="font-serif">{label}</span>
    </button>
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
    <div className="rounded-xl border border-[var(--color-vesta-copper)]/15 bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-[16px] text-[var(--color-vesta-night)]">Alertas Recentes</h3>
        <Bell className="h-4 w-4 text-[var(--color-vesta-copper)]" />
      </div>
      {view.alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem alertas registrados.</p>
      ) : (
        <ul className="space-y-2.5">
          {view.alerts.slice(0, 5).map((a, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className={
                  "mt-0.5 rounded-md px-1.5 py-0.5 text-[9px] uppercase tracking-wider " +
                  (levelBadge[a.level] ?? levelBadge.ok)
                }
              >
                {a.level === "urgent" ? "Urgente" : a.level === "warn" ? "Atenção" : "OK"}
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] leading-snug text-foreground">{a.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{a.body}</p>
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
    <div className="rounded-xl border border-[var(--color-vesta-copper)]/15 bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-[16px] text-[var(--color-vesta-night)]">
          Próximos Vencimentos
        </h3>
        <CalendarClock className="h-4 w-4 text-[var(--color-vesta-copper)]" />
      </div>
      {view.maturities.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem vencimentos registrados.</p>
      ) : (
        <ul className="divide-y divide-[var(--color-vesta-copper)]/10">
          {view.maturities.slice(0, 6).map((m, i) => (
            <li key={i} className="flex items-center justify-between py-2 text-[12.5px]">
              <div className="min-w-0 pr-3">
                <p className="truncate text-foreground">{m.name}</p>
                {m.note && (
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-vesta-copper)]">
                    {m.note}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  {m.date}
                </p>
                <p className="font-serif text-[13px] text-[var(--color-vesta-night)]">
                  {formatBRL(m.value)}
                </p>
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
      <div className="overflow-hidden rounded-xl border border-[var(--color-vesta-copper)]/15 bg-card shadow-sm">
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
  onChangeProfile,
  onSwitchProfile,
}: {
  profileId: ProfileId;
  onChangeProfile: (id: ProfileId) => void;
  onSwitchProfile: () => void;
}) {
  const [nav, setNav] = useState<NavKey>("visao");

  const renderMain = () => {
    if (nav === "visao") return <VisaoGeral profileId={profileId} />;
    if (nav === "alertas")
      return (
        <section className="space-y-4">
          <SectionHeader
            title="Alertas"
            subtitle={getProfileView(profileId).subtitle}
          />
          <AlertasRecentes profileId={profileId} />
        </section>
      );
    if (nav === "vencimentos")
      return (
        <section className="space-y-4">
          <SectionHeader
            title="Vencimentos"
            subtitle={getProfileView(profileId).subtitle}
          />
          <ProximosVencimentos profileId={profileId} />
        </section>
      );
    const item = NAV.find((n) => n.key === nav);
    return <LegacyFallback hash={item?.hash ?? ""} label={item?.label ?? ""} />;
  };

  return (
    <div className="min-h-screen w-full bg-[var(--color-vesta-sand)]">
      <TopBanner />
      <div className="flex min-h-[calc(100vh-92px)] w-full">
        <Sidebar
          activeKey={nav}
          onNav={setNav}
          profileId={profileId}
          onChangeProfile={onChangeProfile}
          onSwitchProfile={onSwitchProfile}
        />
        <main className="min-w-0 flex-1 px-6 py-6 md:px-8">
          <div className="mx-auto w-full max-w-6xl">{renderMain()}</div>
        </main>
      </div>
    </div>
  );
}
