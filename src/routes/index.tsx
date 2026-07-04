import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CalendarClock, FolderUp, Sparkles, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CINTHIA,
  FAMILIAR,
  PAULO,
  PROFILES,
  familyTotals,
  formatBRL,
  totalsOf,
  type Alert as VestaAlert,
  type FamilyProfile,
  type Holding,
  type IndividualProfile,
  type Maturity,
  type ProfileId,
} from "@/data/profiles";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [selected, setSelected] = useState<ProfileId | null>(null);

  if (!selected) return <ProfileSelector onSelect={setSelected} />;

  const profile = PROFILES[selected];
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-10 md:py-10">
      <ProfileHeader
        subtitle={profile.id === "familiar" ? profile.subtitle : (profile as IndividualProfile).subtitle}
        onBack={() => setSelected(null)}
      />
      {profile.id === "familiar" ? (
        <FamilyView profile={profile as FamilyProfile} />
      ) : (
        <IndividualView profile={profile as IndividualProfile} />
      )}
    </div>
  );
}

// ── Selector ────────────────────────────────────────────────────────────

function ProfileSelector({ onSelect }: { onSelect: (id: ProfileId) => void }) {
  // Cinthia first, then Paulo, then Familiar.
  const cards: { id: ProfileId; name: string; sub: string; initial: string; accent: string }[] = [
    { id: "cinthia", name: "Cinthia", sub: "Visão individual", initial: "C", accent: CINTHIA.accent },
    { id: "paulo", name: "Paulo", sub: "Visão individual", initial: "P", accent: PAULO.accent },
    { id: "familiar", name: "Família", sub: "Visão consolidada", initial: "F", accent: "#8FA5C0" },
  ];
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-14 md:py-20">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Vesta <span className="text-primary">✦</span> Guardiã do Patrimônio
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Escolha o perfil para começar.</p>
      </div>
      <div className="grid w-full gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="group flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card p-8 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold"
              style={{ background: `${c.accent}22`, color: c.accent }}
            >
              {c.initial}
            </div>
            <div>
              <div className="text-lg font-medium text-foreground">{c.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Header ──────────────────────────────────────────────────────────────

function ProfileHeader({ subtitle, onBack }: { subtitle: string; onBack: () => void }) {
  return (
    <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Vesta <span className="text-primary">✦</span> Guardiã do Patrimônio
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onBack} className="w-fit">
        <ArrowLeft className="mr-2 h-4 w-4" /> Tela inicial / trocar perfil
      </Button>
    </div>
  );
}

// ── Individual view ─────────────────────────────────────────────────────

function IndividualView({ profile }: { profile: IndividualProfile }) {
  const totals = useMemo(() => totalsOf(profile), [profile]);
  return (
    <div className="space-y-6">
      <TotalsRow totals={totals} />
      <div className="grid gap-4 lg:grid-cols-2">
        <AlertsCard alerts={profile.alerts} />
        <MaturitiesCard maturities={profile.maturities} />
      </div>
      <HoldingsCard title="Posição atual" holdings={profile.holdings} />
      <UploadCard folder={profile.uploadFolder} />
    </div>
  );
}

// ── Family view ─────────────────────────────────────────────────────────

function FamilyView({ profile }: { profile: FamilyProfile }) {
  const totals = useMemo(() => familyTotals(profile), [profile]);
  const alerts = profile.members.flatMap((m) =>
    m.alerts.map((a) => ({ ...a, owner: m.name })),
  );
  const maturities = profile.members.flatMap((m) =>
    m.maturities.map((x) => ({ ...x, owner: m.name })),
  );
  return (
    <div className="space-y-6">
      <TotalsRow totals={totals} />
      <div className="grid gap-4 lg:grid-cols-2">
        <AlertsCard alerts={alerts} showOwner />
        <MaturitiesCard maturities={maturities} showOwner />
      </div>
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-primary" /> Posição atual — por membro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={profile.members[0].id}>
            <TabsList>
              {profile.members.map((m) => (
                <TabsTrigger key={m.id} value={m.id}>
                  {m.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {profile.members.map((m) => (
              <TabsContent key={m.id} value={m.id} className="mt-4">
                <HoldingsTable holdings={m.holdings} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Building blocks ─────────────────────────────────────────────────────

function TotalsRow({ totals }: { totals: { rf: number; rv: number; total: number } }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard label="Patrimônio total" value={formatBRL(totals.total)} icon={Wallet} />
      <StatCard label="Renda fixa" value={formatBRL(totals.rf)} />
      <StatCard label="Renda variável" value={formatBRL(totals.rv)} />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{value}</div>
      </CardContent>
    </Card>
  );
}

function AlertsCard({
  alerts,
  showOwner,
}: {
  alerts: (VestaAlert & { owner?: string })[];
  showOwner?: boolean;
}) {
  const border = (lvl: VestaAlert["level"]) =>
    lvl === "urgent"
      ? "border-l-destructive"
      : lvl === "warn"
        ? "border-l-yellow-500"
        : "border-l-emerald-500";
  const badge = (lvl: VestaAlert["level"]) =>
    lvl === "urgent" ? "URGENTE" : lvl === "warn" ? "VERIFICAR" : "OK";
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-primary" /> Alertas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 && <p className="text-sm text-muted-foreground">Nenhum alerta.</p>}
        {alerts.map((a, i) => (
          <div key={i} className={`rounded-md border border-border border-l-4 bg-card/40 p-3 ${border(a.level)}`}>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                {badge(a.level)}
              </span>
              {showOwner && a.owner && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  [{a.owner}]
                </span>
              )}
              <div className="text-sm font-medium text-foreground">{a.title}</div>
            </div>
            <p className="text-xs text-muted-foreground">{a.body}</p>
            {a.action && <p className="mt-2 text-xs text-foreground"><strong>Ação:</strong> {a.action}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MaturitiesCard({
  maturities,
  showOwner,
}: {
  maturities: (Maturity & { owner?: string })[];
  showOwner?: boolean;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4 text-primary" /> Próximos vencimentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {maturities.length === 0 && <p className="text-sm text-muted-foreground">Sem vencimentos.</p>}
        <ul className="divide-y divide-border">
          {maturities.map((m, i) => (
            <li key={i} className="flex items-center justify-between py-2 text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {showOwner && m.owner && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      [{m.owner}]
                    </span>
                  )}
                  <span className="truncate font-medium text-foreground">{m.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {m.date}
                  {m.note ? ` · ${m.note}` : ""}
                </div>
              </div>
              <div className="ml-3 shrink-0 font-medium tabular-nums text-foreground">{formatBRL(m.value)}</div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function HoldingsCard({ title, holdings }: { title: string; holdings: Holding[] }) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <HoldingsTable holdings={holdings} />
      </CardContent>
    </Card>
  );
}

function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-2 pr-2 font-medium">Ativo</th>
            <th className="py-2 pr-2 font-medium">Classe</th>
            <th className="py-2 pr-2 font-medium">Detalhe</th>
            <th className="py-2 pl-2 text-right font-medium">Valor</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h, i) => (
            <tr key={i} className="border-b border-border/40">
              <td className="py-2 pr-2 font-medium text-foreground">{h.name}</td>
              <td className="py-2 pr-2 text-muted-foreground">{h.klass}</td>
              <td className="py-2 pr-2 text-muted-foreground">{h.detail ?? "—"}</td>
              <td className="py-2 pl-2 text-right font-medium tabular-nums text-foreground">
                {formatBRL(h.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UploadCard({ folder }: { folder: string }) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderUp className="h-4 w-4 text-primary" /> Importar arquivos da XP
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Baixe <strong className="text-foreground">PosicaoDetalhada_DD-MM.xlsx</strong> e{" "}
          <strong className="text-foreground">Extrato_MES.xlsx</strong> em{" "}
          <em>xpi.com.br → Carteira → Exportar</em> e salve na pasta{" "}
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{folder}</span>.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-md border border-dashed border-border bg-card/40 p-4 text-xs text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Upload conectado à automação chegará em breve. Por enquanto, mantenha os arquivos organizados na pasta{" "}
          <strong className="text-foreground">{folder}</strong>.
        </div>
      </CardContent>
    </Card>
  );
}
