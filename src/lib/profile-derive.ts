import {
  PROFILES,
  CINTHIA,
  PAULO,
  totalsOf,
  type IndividualProfile,
  type Alert,
  type Maturity,
  type Holding,
} from "@/data/profiles";

export type KnownProfileId = "cinthia" | "paulo" | "familiar";
export type ProfileId = KnownProfileId | `member:${string}` | `domus:${string}`;

// Regra da casa: só existe UMA vesta local por Domus e nome masculino nunca é
// vesta. Heurística: primeiro nome terminado em "a" (Cínthia, Luiza, Cornelia,
// Cristina, Márcia...) pode ser vesta; Murilo/Paulo/Daniel/Marcus etc. nunca.
export function podeSerVesta(nome?: string | null): boolean {
  const primeiro = (nome ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!primeiro) return false;
  return primeiro.endsWith("a");
}

export type ActiveProfileView = {
  id: ProfileId;
  name: string;
  subtitle: string;
  isFamily: boolean;
  uploadFolder: string | null;
  alerts: (Alert & { owner?: string })[];
  maturities: (Maturity & { owner?: string })[];
  holdings: (Holding & { owner?: string })[];
  totals: { rf: number; rv: number; total: number };
};

function tagAlerts(p: IndividualProfile): (Alert & { owner: string })[] {
  return p.alerts.map((a) => ({ ...a, owner: p.name, title: `[${p.name}] ${a.title}` }));
}
function tagMats(p: IndividualProfile): (Maturity & { owner: string })[] {
  return p.maturities.map((m) => ({ ...m, owner: p.name, name: `[${p.name}] ${m.name}` }));
}
function tagHold(p: IndividualProfile): (Holding & { owner: string })[] {
  return p.holdings.map((h) => ({ ...h, owner: p.name }));
}

export function getProfileView(id: KnownProfileId): ActiveProfileView {
  if (id === "familiar") {
    const tc = totalsOf(CINTHIA);
    const tp = totalsOf(PAULO);
    return {
      id: "familiar",
      name: "Família",
      subtitle: "Família · Visão consolidada",
      isFamily: true,
      uploadFolder: null,
      alerts: [...tagAlerts(CINTHIA), ...tagAlerts(PAULO)],
      maturities: [...tagMats(CINTHIA), ...tagMats(PAULO)].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
      holdings: [...tagHold(CINTHIA), ...tagHold(PAULO)],
      totals: { rf: tc.rf + tp.rf, rv: tc.rv + tp.rv, total: tc.total + tp.total },
    };
  }
  const p = PROFILES[id] as IndividualProfile;
  return {
    id,
    name: p.name,
    subtitle: p.subtitle,
    isFamily: false,
    uploadFolder: p.uploadFolder,
    alerts: p.alerts.map((a) => ({ ...a })),
    maturities: [...p.maturities].sort((a, b) => a.date.localeCompare(b.date)),
    holdings: [...p.holdings],
    totals: totalsOf(p),
  };
}
