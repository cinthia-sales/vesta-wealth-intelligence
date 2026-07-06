// ============================================================
// Sessão mockada (Fase 4a) — vive em memória, não persiste entre reloads.
// Modela: Persona logada, Domus e Escopos editáveis pela Vesta.
// ============================================================

import type { ProfileId } from "@/lib/profile-derive";

export type KnownPersonaId = "cinthia" | "paulo";
export type PersonaId = KnownPersonaId | `member:${string}`;

export type PersonaInfo = {
  id: PersonaId;
  name: string;
  subtitle: string;
  role: "vesta" | "membro";
  initial: string;
};

export const PERSONAE: Record<KnownPersonaId, PersonaInfo> = {
  cinthia: {
    id: "cinthia",
    name: "Cínthia",
    subtitle: "Vesta · Família Furtado",
    role: "vesta",
    initial: "C",
  },
  paulo: {
    id: "paulo",
    name: "Paulo",
    subtitle: "Persona · Família Furtado",
    role: "membro",
    initial: "P",
  },
};

export const DOMUS_NAME = "Família Malta Furtado";

// Escopo de visão que a Vesta define para cada membro.
// "Ver a própria carteira" é implícito (sempre true).
export type Scope = {
  seeConsolidado: boolean;      // ve o "Familiar - Domus"
  seePersonae: ProfileId[];     // outras Personae que este membro pode ver
};

export type ScopeMap = Record<string, Scope>;

export const DEFAULT_SCOPES: ScopeMap = {
  // Vesta é soberana — vê tudo sempre. Escopo aqui é só formal.
  cinthia: { seeConsolidado: true, seePersonae: ["paulo"] },
  // Paulo, no default, só vê a própria carteira. A Vesta muda isso na tela Domus.
  paulo:   { seeConsolidado: false, seePersonae: [] },
};

export function getPersonaInfo(id: PersonaId): PersonaInfo {
  if (id === "cinthia" || id === "paulo") return PERSONAE[id];
  return {
    id,
    name: "Novo membro",
    subtitle: "Persona · Domus",
    role: "membro",
    initial: "N",
  };
}

// Dada a Persona logada + seu Scope, retorna as "views" (ProfileIds) que
// ela pode abrir no ProfileSelector.
export function allowedProfiles(loggedAs: PersonaId, scope: Scope): ProfileId[] {
  // Vesta é soberana — sempre vê tudo, independente do que o scope diz.
  if (getPersonaInfo(loggedAs).role === "vesta") {
    return ["cinthia", "paulo", "familiar"];
  }
  const list: ProfileId[] = [loggedAs === "paulo" ? "paulo" : loggedAs];
  for (const p of scope.seePersonae) {
    if (p !== loggedAs && !list.includes(p)) list.push(p);
  }
  if (scope.seeConsolidado) list.push("familiar");
  return list;
}
