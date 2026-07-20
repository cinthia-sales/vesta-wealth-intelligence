import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ProfileSelector, VestaShell } from "@/components/vesta/shell";
import { EntryHall, type HallDomus, type HallPending } from "@/components/vesta/entry-hall";
import { getUser, registerDomusProfiles } from "@/data/vesta-users";
import { supabase } from "@/integrations/supabase/client";
import { ACCESS_ACCOUNTS, ACCESS_AUTH_KEY, ACCESS_DEFAULT_PASSWORD, getAccessAccount } from "@/lib/vesta-access-keys";
import type { ProfileId } from "@/lib/profile-derive";
import {
  DEFAULT_SCOPES,
  getPersonaInfo,
  type PersonaId,
  type ScopeMap,
} from "@/state/session";

export const Route = createFileRoute("/_authenticated/app")({
  component: VestaApp,
});

const CINTHIA_EMAIL = "cinthiavr@yahoo.com.br";
const PAULO_EMAIL = "phfurtadovr@yahoo.com.br";
const LUIZA_EMAIL = "lu.abrantes@gmail.com";
const DANIEL_EMAIL = "dmalta256@gmail.com";
const SIMPLE_MALTA_DOMUS_ID = "simple-malta-furtado";
const DEMO_DOMUS_ID = "demo-exemplum";
const DEMO_CORNELIA = "member:demo-cornelia" as ProfileId;
const DEMO_MARCUS = "member:demo-marcus" as ProfileId;
const DEMO_CONSOLIDATED = `domus:${DEMO_DOMUS_ID}` as ProfileId;
const DEMO_VIEWS: ProfileId[] = [DEMO_CONSOLIDATED, DEMO_CORNELIA, DEMO_MARCUS];

function displayDomusName(name: string): string {
  if (/malta[\s-]*furtado/i.test(name)) return "Domus Malta-Furtado";
  return name.replace(/^fam[íi]lia\s+/i, "Domus ");
}

function keyForProfile(profileId: string, email?: string | null, name?: string | null): PersonaId {
  const lower = (email ?? "").toLowerCase();
  const profileName = (name ?? "").toLowerCase();
  if (lower === CINTHIA_EMAIL) return "cinthia";
  if (lower === PAULO_EMAIL) return "paulo";
  if (lower === LUIZA_EMAIL || profileName.includes("luiza")) return "member:luiza-abrantes";
  return `member:${profileId}`;
}

function isLuizaMember(member: any): boolean {
  return (member?.profile?.email ?? "").toLowerCase() === LUIZA_EMAIL;
}

function isAbrantesMember(member: any): boolean {
  return /abrantes/i.test(displayDomusName(member?.domus?.nome ?? ""));
}

function memberPapel(member: any): string {
  return isLuizaMember(member) && isAbrantesMember(member) ? "vesta" : member?.papel;
}

function normalizeMemberPapel(member: any): any {
  const papel = memberPapel(member);
  return papel === member?.papel ? member : { ...member, papel };
}

function buildSimpleSession(email: string) {
  const account = getAccessAccount(email);
  const profile =
    account?.profile === "paulo"
      ? { id: "simple-paulo", nome: "Paulo", email: PAULO_EMAIL, primeiro_acesso: false }
      : account?.profile === "daniel"
        ? { id: "simple-daniel", nome: "Daniel Malta Furtado", email: DANIEL_EMAIL, primeiro_acesso: false }
        : account?.profile === "cornelia"
          ? { id: "demo-cornelia", nome: "Cornelia", email: account.email, primeiro_acesso: false }
          : { id: "demo-marcus", nome: "Marcus", email: account?.email ?? email.toLowerCase(), primeiro_acesso: false };
  if (account?.profile === "cornelia" || account?.profile === "marcus") {
    const members = [
      {
        id: "demo-cornelia-membership",
        domus_id: DEMO_DOMUS_ID,
        profile_id: "demo-cornelia",
        papel: "vesta",
        created_at: "2026-01-01",
        domus: { nome: "Domus Exemplum" },
        profile: { nome: "Cornelia", email: "cornelia@domus-exemplum.vesta" },
      },
      {
        id: "demo-marcus-membership",
        domus_id: DEMO_DOMUS_ID,
        profile_id: "demo-marcus",
        papel: "membro",
        created_at: "2026-01-02",
        domus: { nome: "Domus Exemplum" },
        profile: { nome: "Marcus", email: "marcus@domus-exemplum.vesta" },
      },
    ];
    return {
      role: account.profile === "cornelia" ? "vesta" : "membro",
      profile,
      memberships: members.filter((member) => member.profile_id === profile.id),
      members,
      domus: [{ id: DEMO_DOMUS_ID, nome: "Domus Exemplum" }],
      requests: [],
      scopes: [
        {
          id: `scope:${profile.id}`,
          domus_id: DEMO_DOMUS_ID,
          member_profile_id: profile.id,
          can_see_consolidado: true,
          can_see_member_profile_ids: [profile.id],
          updated_at: "2026-01-01",
        },
      ],
    };
  }
  const members = [
    {
      id: "simple-cinthia-membership",
      domus_id: SIMPLE_MALTA_DOMUS_ID,
      profile_id: "simple-cinthia",
      papel: "vesta",
      created_at: "2026-01-01",
      domus: { nome: "Domus Malta-Furtado" },
      profile: { nome: "Cínthia", email: CINTHIA_EMAIL },
    },
    {
      id: "simple-paulo-membership",
      domus_id: SIMPLE_MALTA_DOMUS_ID,
      profile_id: "simple-paulo",
      papel: "membro",
      created_at: "2026-01-02",
      domus: { nome: "Domus Malta-Furtado" },
      profile: { nome: "Paulo", email: PAULO_EMAIL },
    },
    {
      id: "simple-daniel-membership",
      domus_id: SIMPLE_MALTA_DOMUS_ID,
      profile_id: "simple-daniel",
      papel: "membro",
      created_at: "2026-01-03",
      domus: { nome: "Domus Malta-Furtado" },
      profile: { nome: "Daniel Malta Furtado", email: DANIEL_EMAIL },
    },
  ];
  return {
    role: "membro",
    profile,
    memberships: members.filter((member) => member.profile_id === profile.id),
    members,
    domus: [{ id: SIMPLE_MALTA_DOMUS_ID, nome: "Domus Malta-Furtado" }],
    requests: [],
    scopes: [],
  };
}

function profileIdForKey(key: string, sessionData: any): string | null {
  if (key === "cinthia") return sessionData.profile?.id ?? null;
  const member = (sessionData.members ?? []).find(
    (m: any) => keyForProfile(m.profile_id, m.profile?.email, m.profile?.nome) === key,
  );
  return member?.profile_id ?? null;
}

function buildScopes(sessionData: any): ScopeMap {
  const next: ScopeMap = { ...DEFAULT_SCOPES };
  if (!sessionData.profile) return next;
  const memberKey = keyForProfile(sessionData.profile.id, sessionData.profile.email, sessionData.profile.nome);
  const visible = (sessionData.scope?.can_see_member_profile_ids ?? [])
    .map((id: string) => {
      const found = (sessionData.members ?? []).find((m: any) => m.profile_id === id);
      if (found) return keyForProfile(found.profile_id, found.profile?.email, found.profile?.nome);
      if (id === sessionData.profile?.id) return memberKey;
      return null;
    })
    .filter(Boolean) as PersonaId[];

  if (sessionData.role !== "vesta") {
    next[memberKey] = {
      seeConsolidado: !!sessionData.scope?.can_see_consolidado,
      seePersonae: visible,
    };
  }
  return next;
}

// Vesta Soberana (Cinthia) vs Semi-Vesta (vesta de um Domus específico)
function isVestaSoberana(sessionData: any): boolean {
  return (
    sessionData?.role === "vesta" &&
    (sessionData?.profile?.email ?? "").toLowerCase() === CINTHIA_EMAIL
  );
}

// Para Semi-Vesta: filtra membros pelo próprio Domus
function membersForRole(sessionData: any): any[] {
  const all = sessionData?.members ?? [];
  if (sessionData?.role !== "vesta") return all;
  if (isVestaSoberana(sessionData)) return all;
  // Semi-Vesta: só vê membros do próprio Domus
  const myDomusId = sessionData?.membership?.domus_id;
  if (!myDomusId) return all;
  return all.filter((m: any) => m.domus_id === myDomusId);
}

// Para Semi-Vesta: perfis que pode selecionar (só do próprio Domus)
function allowedForSession(sessionData: any, scopes: ScopeMap): ProfileId[] {
  if (!sessionData?.profile) return [];
  const loggedAs: PersonaId =
    sessionData.role === "vesta"
      ? isVestaSoberana(sessionData)
        ? "cinthia"
        : keyForProfile(sessionData.profile.id, sessionData.profile.email, sessionData.profile.nome)
      : keyForProfile(sessionData.profile.id, sessionData.profile.email, sessionData.profile.nome);

  const scope = scopes[loggedAs] ?? { seeConsolidado: false, seePersonae: [] };
  const base: ProfileId[] = [loggedAs as ProfileId];
  for (const candidate of scope.seePersonae) {
    if (!base.includes(candidate)) base.push(candidate);
  }
  if (scope.seeConsolidado && sessionData.membership?.domus_id) {
    const domusName = sessionData.membership?.domus?.nome ?? "";
    const consolidatedId = (/malta|furtado/i.test(domusName)
      ? "familiar"
      : `domus:${sessionData.membership.domus_id}`) as ProfileId;
    if (!base.includes(consolidatedId)) base.unshift(consolidatedId);
  }

  const hardcodedEmails = new Set(["cinthiavr@yahoo.com.br", "phfurtadovr@yahoo.com.br"]);
  const memberProfiles: ProfileId[] = (sessionData.members ?? [])
    .filter((m: any) => m.profile && !hardcodedEmails.has((m.profile.email ?? "").toLowerCase()))
    .map((m: any) => keyForProfile(m.profile_id, m.profile?.email, m.profile?.nome) as ProfileId);

  // Soberana: vê todos os perfis hardcoded + todos os membros do banco
  if (isVestaSoberana(sessionData)) {
    const domusName = sessionData.membership?.domus?.nome ?? "";
    const isMaltaFurtado = /malta|furtado/i.test(domusName);
    if (!isMaltaFurtado) return [`domus:${sessionData.membership.domus_id}`, ...memberProfiles];
    const sovereignViews: ProfileId[] = ["familiar", "cinthia", "paulo"];
    return [...sovereignViews, ...memberProfiles.filter((p) => !sovereignViews.includes(p))];
  }

  // Semi-Vesta: só vê os membros do próprio Domus
  if (sessionData.role === "vesta") {
    const myDomusId = sessionData.membership?.domus_id;
    if (!myDomusId) return [loggedAs];
    const domusProfiles = memberProfiles.filter((p) => {
      const m = (sessionData.members ?? []).find(
        (m: any) => keyForProfile(m.profile_id, m.profile?.email, m.profile?.nome) === p,
      );
      return m?.domus_id === myDomusId;
    });
    return [`domus:${myDomusId}`, loggedAs, ...domusProfiles.filter((k) => k !== loggedAs)];
  }

  return base;
}

function VestaApp() {
  const navigate = useNavigate();
  const [scopes, setScopes] = useState<ScopeMap>(DEFAULT_SCOPES);
  const [profile, setProfile] = useState<ProfileId | null>(null);
  const [selectingProfile, setSelectingProfile] = useState(false);
  const [selectedDomusId, setSelectedDomusId] = useState<string | null>(null);
  const [showHall, setShowHall] = useState(true);
  const [initialPage, setInitialPage] = useState<"home" | "domus" | "upload">("home");
  const [saudacao, setSaudacao] = useState(false);
  const [simpleAuthEmail, setSimpleAuthEmail] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem(ACCESS_AUTH_KEY)?.toLowerCase() ?? null,
  );

  // Inclui o userId na key — cada usuário tem seu próprio cache, sem flash de sessão anterior
  const { data: authUser, isLoading: isAuthLoading } = useQuery<any>({
    queryKey: ["auth-user", simpleAuthEmail],
    queryFn: async () => {
      const realUser = await supabase.auth.getUser();
      if (realUser.data.user) return realUser;
      if (simpleAuthEmail) {
        return {
          data: { user: { id: `simple:${simpleAuthEmail}`, email: simpleAuthEmail } },
          error: null,
        };
      }
      return realUser;
    },
    staleTime: 0,
    gcTime: 0,
  });
  const userId = authUser?.data?.user?.id ?? null;
  const activeSimpleAuthEmail = userId?.startsWith("simple:") ? simpleAuthEmail : null;

  const { data: sessionData, isLoading: isSessionLoading } = useQuery({
    queryKey: ["domus-session", userId, activeSimpleAuthEmail],
    queryFn: async () => {
      if (activeSimpleAuthEmail) return buildSimpleSession(activeSimpleAuthEmail);

      const { data: sessionResult } = await supabase.auth.getSession();
      if (!sessionResult.session) {
        return { role: null, profile: null, memberships: [], members: [], scopes: [] };
      }
      const uid = sessionResult.session.user.id;

      const [roleRes, profileRes, membershipRes, allMembersRes, allDomusRes, requestsRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid).maybeSingle(),
        supabase.from("profiles").select("id,nome,email,primeiro_acesso").eq("id", uid).maybeSingle(),
        supabase.from("domus_members")
          .select("id,domus_id,profile_id,papel,created_at,domus:domus_id(nome),profile:profile_id(nome,email)")
          .eq("profile_id", uid)
          .order("created_at", { ascending: true }),
        supabase.from("domus_members")
          .select("id,domus_id,profile_id,papel,created_at,domus:domus_id(nome),profile:profile_id(nome,email)")
          .order("created_at", { ascending: false }),
        supabase.from("domus").select("id,nome").order("created_at", { ascending: true }),
        supabase.from("domus_join_requests")
          .select("id,domus_id,nome,email,mensagem,status,created_at")
          .eq("status", "pendente")
          .order("created_at", { ascending: false }),
      ]);

      const { data: scopesData } = await supabase
        .from("domus_visibility_scopes")
        .select("id,domus_id,member_profile_id,can_see_consolidado,can_see_member_profile_ids,updated_at")
        .eq("member_profile_id", uid);

      const memberships = (membershipRes.data ?? []).map(normalizeMemberPapel);
      const members = (allMembersRes.data ?? []).map(normalizeMemberPapel);
      const isLuizaAbrantesVesta = (profileRes.data?.email ?? "").toLowerCase() === LUIZA_EMAIL &&
        memberships.some((member: any) => memberPapel(member) === "vesta");

      return {
        role: isLuizaAbrantesVesta ? "vesta" : roleRes.data?.role ?? null,
        profile: profileRes.data ?? null,
        memberships,
        members,
        domus: allDomusRes.data ?? [],
        requests: requestsRes.data ?? [],
        scopes: scopesData ?? [],
      };
    },
    enabled: authUser !== undefined,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  const soberana = isVestaSoberana(sessionData);
  const simpleAccessAccount = activeSimpleAuthEmail ? getAccessAccount(activeSimpleAuthEmail) : null;
  const shouldIncludeDemoDomus =
    soberana ||
    simpleAccessAccount?.profile === "cornelia" ||
    simpleAccessAccount?.profile === "marcus";
  const domusOptions: Array<{ id: string; nome: string }> = (() => {
    const options = soberana ? (sessionData?.domus ?? []).map((domus: any) => ({
      ...domus,
      nome: displayDomusName(domus.nome),
    })) : (() => {
      const unique = new Map<string, string>();
      for (const row of sessionData?.memberships ?? []) {
        if (row.domus_id && row.domus?.nome) unique.set(row.domus_id, row.domus.nome);
      }
      return Array.from(unique, ([id, nome]) => ({ id, nome: displayDomusName(nome) }));
    })();
    if (shouldIncludeDemoDomus && !options.some((option: any) => option.id === DEMO_DOMUS_ID)) {
      options.push({ id: DEMO_DOMUS_ID, nome: "Domus Exemplum" });
    }
    return options.sort((a: any, b: any) => {
      const aMalta = /malta.*furtado/i.test(a.nome) ? 0 : 1;
      const bMalta = /malta.*furtado/i.test(b.nome) ? 0 : 1;
      return aMalta - bMalta || a.nome.localeCompare(b.nome, "pt-BR");
    });
  })();
  const selectedDomusStillAllowed =
    !selectedDomusId || domusOptions.some((domus) => domus.id === selectedDomusId);

  const activeDomusId = selectedDomusId ?? (domusOptions.length === 1 ? domusOptions[0].id : null);
  const activeMembership = activeDomusId
    ? (sessionData?.memberships ?? []).find((m: any) => m.domus_id === activeDomusId) ?? {
        domus_id: activeDomusId,
        domus: { nome: domusOptions.find((d) => d.id === activeDomusId)?.nome },
      }
    : null;
  const activeScope = activeDomusId
    ? (sessionData?.scopes ?? []).find((s: any) => s.domus_id === activeDomusId) ?? null
    : null;
  const activeMembers = activeDomusId
    ? (sessionData?.members ?? []).filter((m: any) => m.domus_id === activeDomusId)
    : [];
  const activeSession = sessionData && activeDomusId
    ? { ...sessionData, membership: activeMembership, scope: activeScope, members: activeMembers }
    : null;

  useEffect(() => {
    if (selectedDomusId && !selectedDomusStillAllowed) {
      setSelectedDomusId(null);
      setProfile(null);
      setShowHall(true);
    }
  }, [selectedDomusId, selectedDomusStillAllowed]);

  useEffect(() => {
    if (activeSession) {
      setScopes(buildScopes(activeSession));
      setSelectingProfile(false);
    }
  }, [activeDomusId, sessionData]);

  useEffect(() => {
    if (!sessionData) return;
    if (activeSimpleAuthEmail) return;
    if (sessionData.role === "vesta") return;
    let ativo = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      const { data: perfil } = await supabase
        .from("profiles")
        .select("primeiro_acesso")
        .eq("id", uid)
        .maybeSingle();
      if (ativo && perfil?.primeiro_acesso) setSaudacao(true);
    })();
    return () => {
      ativo = false;
    };
  }, [sessionData, activeSimpleAuthEmail]);

  const dispensarSaudacao = async () => {
    setSaudacao(false);
    if (activeSimpleAuthEmail) return;
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (uid) {
      await supabase.from("profiles").update({ primeiro_acesso: false }).eq("id", uid);
    }
  };

  if (isAuthLoading || authUser === undefined || isSessionLoading || sessionData === undefined) {
    return (
      <div id="profile-screen">
        <div className="ps-vesta">✦ Vesta ✦</div>
        <div className="ps-subtitle">Carregando…</div>
      </div>
    );
  }

  const loggedAs: PersonaId = soberana
    ? "cinthia"
    : sessionData?.role === "vesta" && sessionData.profile
      ? keyForProfile(sessionData.profile.id, sessionData.profile.email, sessionData.profile.nome)
      : sessionData?.profile
        ? keyForProfile(sessionData.profile.id, sessionData.profile.email, sessionData.profile.nome)
        : (`member:${userId ?? "unknown"}` as PersonaId);

  const scope = scopes[loggedAs] ?? { seeConsolidado: false, seePersonae: [] };
  const allowed = activeDomusId === DEMO_DOMUS_ID
    ? DEMO_VIEWS
    : allowedForSession(activeSession, scopes);
  const visibleMembers = membersForRole(activeSession);

  // Uma única visão é aberta automaticamente; múltiplas exigem escolha explícita.
  const effectiveProfile: ProfileId | null =
    profile ?? (allowed.length === 1 ? allowed[0] : null);

  const doLogout = async () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(ACCESS_AUTH_KEY);
    setSimpleAuthEmail(null);
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const saudacaoOverlay = saudacao ? (
    <div className="vesta-saudacao-overlay" onClick={dispensarSaudacao}>
      <div className="vesta-saudacao-card" onClick={(e) => e.stopPropagation()}>
        <div className="vesta-saudacao-flame">✦</div>
        <p className="public-domus-kicker">Vesta · Domus et Patrimonium</p>
        <h2>Bem-vindo(a) ao Domus</h2>
        <p className="vesta-saudacao-copy">
          A magnânima Deusa Vesta permitiu seu acesso — <em>sob supervisão</em>.
          Aqui você acompanha o que a Deusa te liberou; o resto continua nas mãos dela.
        </p>
        <button onClick={dispensarSaudacao}>Entrar no Domus</button>
      </div>
    </div>
  ) : null;

  // Nome do usuário LOGADO (para "Logada como")
  const loggedName: string | undefined =
    sessionData?.profile?.nome ??
    sessionData?.profile?.email ??
    undefined;

  const sessionForDomus = (domusId: string) => {
    const membership = (sessionData?.memberships ?? []).find((m: any) => m.domus_id === domusId) ?? {
      domus_id: domusId,
      domus: { nome: domusOptions.find((d) => d.id === domusId)?.nome },
    };
    const domusScope = (sessionData?.scopes ?? []).find((s: any) => s.domus_id === domusId) ?? null;
    const members = (sessionData?.members ?? []).filter((m: any) => m.domus_id === domusId);
    return { ...sessionData, membership, scope: domusScope, members };
  };

  const hallDomus: HallDomus[] = domusOptions.map((domus) => {
    if (domus.id === DEMO_DOMUS_ID) {
      registerDomusProfiles(DEMO_DOMUS_ID, "Domus Exemplum", [DEMO_CORNELIA, DEMO_MARCUS]);
      return {
        id: DEMO_DOMUS_ID,
        name: "Domus Exemplum",
        vestaName: "Cornelia",
        memberCount: 2,
        canManage: soberana,
        views: [
          { id: DEMO_CONSOLIDATED, name: "Consolidado", subtitle: "Visão consolidada demonstrativa", initials: "🏛", consolidated: true },
          { id: DEMO_CORNELIA, name: "Cornelia", subtitle: "Vesta · carteira demonstrativa", initials: "C" },
          { id: DEMO_MARCUS, name: "Marcus", subtitle: "Persona · carteira demonstrativa", initials: "M" },
        ],
      };
    }
    const domusSession = sessionForDomus(domus.id);
    const registeredProfiles = Array.from(new Set(
      domusSession.members
        .filter((member: any) => member.profile)
        .map((member: any) => keyForProfile(member.profile_id, member.profile?.email, member.profile?.nome) as ProfileId),
    ));
    registerDomusProfiles(domus.id, domus.nome, registeredProfiles);
    const domusScopes = buildScopes(domusSession);
    const views = allowedForSession(domusSession, domusScopes).map((id) => {
      if (id === "familiar" || id.startsWith("domus:")) {
        return {
          id,
          name: "Consolidado",
          subtitle: "Visão familiar do Domus",
          initials: "🏛",
          consolidated: true,
          waitingForData: getUser(id).total <= 0,
        };
      }
      const knownName = id === "cinthia" ? "Cínthia" : id === "paulo" ? "Paulo" : id === "member:luiza-abrantes" ? "Luiza" : null;
      const uuid = id.startsWith("member:") ? id.slice(7) : null;
      const member = uuid ? domusSession.members.find((m: any) => m.profile_id === uuid) : null;
      const name = knownName ?? member?.profile?.nome ?? member?.profile?.email;
      return {
        id,
        name: name ?? "Perfil indisponível",
        subtitle: "Visão individual",
        initials: (name ?? "V").charAt(0).toUpperCase(),
        waitingForData: getUser(id).total <= 0,
      };
    });
    const vestaMember = domusSession.members.find((m: any) => memberPapel(m) === "vesta");
    const ownMembership = (sessionData?.memberships ?? []).find((m: any) => m.domus_id === domus.id);
    return {
      id: domus.id,
      name: domus.nome,
      vestaName: vestaMember?.profile?.nome ?? vestaMember?.profile?.email ??
        (/malta|furtado/i.test(domus.nome) && soberana ? (sessionData?.profile?.nome ?? undefined) : undefined),
      memberCount: views.filter((view) => !view.consolidated).length,
      canManage: sessionData?.role === "vesta" && (soberana || memberPapel(ownMembership) === "vesta"),
      views,
    };
  });

  const allowedDomusIds = new Set(domusOptions.map((d) => d.id));
  const hallPending: HallPending[] = sessionData?.role === "vesta"
    ? (sessionData?.requests ?? [])
        .filter((request: any) => allowedDomusIds.has(request.domus_id))
        .map((request: any) => ({
          id: `request:${request.id}`,
          domusId: request.domus_id,
          label: request.nome,
          detail: `${request.email}${request.mensagem ? ` · ${request.mensagem}` : ""}`,
          kind: "request" as const,
        }))
    : [];
  const hallAccessKeys = soberana
    ? [
        ...ACCESS_ACCOUNTS.map((account) => ({
          email: account.email,
          name: account.name,
          domus: account.domus,
          password: ACCESS_DEFAULT_PASSWORD,
          note: account.note,
        })),
        // Membros reais criados no banco (ex.: Luiza) — mesma vitrine dos demais
        ...(sessionData?.members ?? [])
          .filter((m: any) => {
            const email = (m.profile?.email ?? "").toLowerCase();
            if (!email) return false;
            if (email === (sessionData?.profile?.email ?? "").toLowerCase()) return false;
            return !ACCESS_ACCOUNTS.some((a) => a.email === email);
          })
          .map((m: any) => ({
            email: m.profile.email,
            name: m.profile.nome ?? m.profile.email,
            domus: m.domus?.nome ?? "Domus",
            password: ACCESS_DEFAULT_PASSWORD,
            note: memberPapel(m) === "vesta" ? "vesta do domus" : "membro",
          })),
      ]
    : [];

  // Nome do PERFIL SELECIONADO (pode ser um membro diferente do logado)
  const profileName: string | undefined = (() => {
    if (!effectiveProfile) return loggedName;
    if (effectiveProfile === DEMO_CORNELIA) return "Cornelia";
    if (effectiveProfile === DEMO_MARCUS) return "Marcus";
    if (effectiveProfile === DEMO_CONSOLIDATED) return "Domus Exemplum";
    if (effectiveProfile === "cinthia" || effectiveProfile === "paulo" || effectiveProfile === "familiar") return undefined;
    if (effectiveProfile.startsWith("domus:")) {
      return domusOptions.find((domus) => domus.id === effectiveProfile.slice(6))?.nome;
    }
    const uuid = effectiveProfile.replace("member:", "");
    const found = (sessionData?.members ?? []).find((m: any) => m.profile_id === uuid);
    return found?.profile?.nome ?? found?.profile?.email ?? undefined;
  })();

  if (!sessionData?.profile) {
    return (
      <div id="profile-screen">
        <div className="ps-vesta">✦ Vesta ✦</div>
        <div className="ps-title">Perfil não encontrado</div>
        <div className="ps-subtitle">Não foi possível localizar um perfil para esta conta.</div>
        <button className="ps-logout" onClick={doLogout}>Sair</button>
      </div>
    );
  }

  if (domusOptions.length === 0) {
    return (
      <div id="profile-screen">
        <div className="ps-vesta">✦ Vesta ✦</div>
        <div className="ps-title">Acesso não concedido</div>
        <div className="ps-subtitle">Sua conta ainda não possui acesso a nenhum Domus.</div>
        <button className="ps-logout" onClick={doLogout}>Sair</button>
      </div>
    );
  }

  if (showHall) {
    return (
      <>
        {saudacaoOverlay}
        <EntryHall
          name={(loggedName ?? "Membro").split(" ")[0]}
          intro={
            soberana
              ? "Escolha o Domus e a visão que deseja acompanhar."
              : "Escolha a carteira ou o consolidado que deseja acompanhar."
          }
          domus={hallDomus}
          pending={hallPending}
          accessKeys={hallAccessKeys}
          onOpenView={(domusId, profileId) => {
            setSelectedDomusId(domusId);
            setProfile(profileId);
            setInitialPage("home");
            setShowHall(false);
          }}
          onManageDomus={(domusId) => {
            const domusSession = sessionForDomus(domusId);
            const permitted = allowedForSession(domusSession, buildScopes(domusSession));
            const ownKey = keyForProfile(sessionData.profile!.id, sessionData.profile!.email, sessionData.profile!.nome) as ProfileId;
            const managementProfile = permitted.includes(ownKey) ? ownKey : permitted[0];
            if (!managementProfile) return;
            setSelectedDomusId(domusId);
            setProfile(managementProfile);
            setInitialPage("domus");
            setShowHall(false);
          }}
          onReviewPending={(domusId) => {
            const domusSession = sessionForDomus(domusId);
            const permitted = allowedForSession(domusSession, buildScopes(domusSession));
            const ownKey = keyForProfile(sessionData.profile!.id, sessionData.profile!.email, sessionData.profile!.nome) as ProfileId;
            const managementProfile = permitted.includes(ownKey) ? ownKey : permitted[0];
            if (!managementProfile) return;
            setSelectedDomusId(domusId);
            setProfile(managementProfile);
            setInitialPage("domus");
            setShowHall(false);
          }}
          onLogout={doLogout}
        />
      </>
    );
  }

  if (!activeDomusId) {
    return (
      <div id="profile-screen">
        <div className="ps-vesta">✦ Vesta ✦</div>
        <div className="ps-title">Escolha o seu Domus</div>
        <div className="ps-subtitle">{loggedName} · selecione onde deseja entrar</div>
        <div className="ps-profiles">
          {domusOptions.map((domus) => (
            <button key={domus.id} className="ps-card" onClick={() => setSelectedDomusId(domus.id)}>
              <div className="ps-avatar ps-av-fam">⌂</div>
              <div>
                <div className="ps-card-name">{domus.nome.toUpperCase()}</div>
                <div className="ps-card-desc">Acessar visões permitidas neste Domus</div>
                <div className="ps-card-badge ps-badge-fam">Acesso autorizado</div>
              </div>
            </button>
          ))}
        </div>
        <button className="ps-logout" onClick={doLogout}>Sair</button>
      </div>
    );
  }

  if (selectingProfile || (!effectiveProfile && allowed.length > 1)) {
    return (
      <ProfileSelector
        allowed={allowed}
        loggedAs={loggedAs}
        onSelect={(next) => { setProfile(next); setSelectingProfile(false); }}
        onLogout={doLogout}
        extras={visibleMembers}
        groupByDomus={soberana}
      />
    );
  }

  if (!effectiveProfile || !allowed.includes(effectiveProfile)) {
    return (
      <div id="profile-screen">
        <div className="ps-vesta">✦ Vesta ✦</div>
        <div className="ps-title">Acesso negado</div>
        <div className="ps-subtitle">Nenhuma visão permitida está disponível neste Domus.</div>
        <button className="ps-logout" onClick={doLogout}>Sair</button>
      </div>
    );
  }

  return (
    <>
      {saudacaoOverlay}
      <VestaShell
        profileId={effectiveProfile}
        initialPage={initialPage}
        loggedAs={loggedAs}
        loggedName={loggedName}
        profileName={profileName}
        gestoraName={
          activeDomusId === DEMO_DOMUS_ID
            ? "Cornelia"
            : ((sessionData?.members ?? []).find(
                (m: any) => m.domus_id === activeDomusId && memberPapel(m) === "vesta",
              )?.profile?.nome ?? sessionData?.profile?.nome ?? undefined)
        }
        loggedRole={sessionData?.role ?? null}
        scopes={scopes}
        onUpdateScopes={
          sessionData?.role === "vesta" ? setScopes : undefined
        }
        profileIdForScopeKey={(key: string) => profileIdForKey(key, sessionData)}
        activeDomusId={activeDomusId}
        onChangeProfile={setProfile}
        onSwitchProfile={() => {
          setShowHall(true);
          setProfile(null);
        }}
        onBackToHall={() => { setShowHall(true); setProfile(null); }}
        onLogout={doLogout}
      />
    </>
  );
}
