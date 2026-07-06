import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ProfileSelector, VestaShell } from "@/components/vesta/shell";
import { supabase } from "@/integrations/supabase/client";
import type { ProfileId } from "@/lib/profile-derive";
import {
  DEFAULT_SCOPES,
  allowedProfiles,
  getPersonaInfo,
  type PersonaId,
  type ScopeMap,
} from "@/state/session";
import { getDomusSession } from "@/lib/domus.functions";

export const Route = createFileRoute("/_authenticated/app")({
  component: VestaApp,
});

const CINTHIA_EMAIL = "cinthiavr@yahoo.com.br";
const PAULO_EMAIL = "phfurtadovr@yahoo.com.br";

function keyForProfile(profileId: string, email?: string | null): PersonaId {
  const lower = (email ?? "").toLowerCase();
  if (lower === CINTHIA_EMAIL) return "cinthia";
  if (lower === PAULO_EMAIL) return "paulo";
  return `member:${profileId}`;
}

function profileIdForKey(key: string, sessionData: any): string | null {
  if (key === "cinthia") return sessionData.profile?.id ?? null;
  const member = (sessionData.members ?? []).find(
    (m: any) => keyForProfile(m.profile_id, m.profile?.email) === key,
  );
  return member?.profile_id ?? null;
}

function buildScopes(sessionData: any): ScopeMap {
  const next: ScopeMap = { ...DEFAULT_SCOPES };
  const memberKey = sessionData.profile
    ? keyForProfile(sessionData.profile.id, sessionData.profile.email)
    : "paulo";
  const visible = (sessionData.scope?.can_see_member_profile_ids ?? [])
    .map((id: string) => {
      const found = (sessionData.members ?? []).find((m: any) => m.profile_id === id);
      if (found) return keyForProfile(found.profile_id, found.profile?.email);
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
  if (!sessionData) return [];
  const loggedAs: PersonaId =
    sessionData.role === "vesta"
      ? isVestaSoberana(sessionData)
        ? "cinthia"
        : (`member:${sessionData.profile?.id}` as PersonaId)
      : sessionData.profile
        ? keyForProfile(sessionData.profile.id, sessionData.profile.email)
        : "paulo";

  const scope = scopes[loggedAs] ?? { seeConsolidado: false, seePersonae: [] };
  const base = allowedProfiles(loggedAs, scope);

  // Semi-Vesta: só pode ver membros do próprio Domus + o próprio "familiar" do Domus
  if (sessionData.role === "vesta" && !isVestaSoberana(sessionData)) {
    const myDomusId = sessionData.membership?.domus_id;
    const domusMembers = membersForRole(sessionData);
    const memberKeys: ProfileId[] = domusMembers
      .filter((m: any) => !["cinthiavr@yahoo.com.br", "phfurtadovr@yahoo.com.br"].includes((m.profile?.email ?? "").toLowerCase()))
      .map((m: any) => `member:${m.profile_id}` as ProfileId);
    // Remove hardcoded cards; inclui só os do Domus e "familiar" se quiser
    return [loggedAs, ...memberKeys.filter((k) => k !== loggedAs)];
  }

  return base;
}

function VestaApp() {
  const navigate = useNavigate();
  const [scopes, setScopes] = useState<ScopeMap>(DEFAULT_SCOPES);
  const [profile, setProfile] = useState<ProfileId | null>(null);
  const [saudacao, setSaudacao] = useState(false);

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ["domus-session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) {
        return { role: null, profile: null, membership: null, members: [], scope: null };
      }
      return getDomusSession();
    },
    retry: false,
  });

  useEffect(() => {
    if (sessionData) setScopes(buildScopes(sessionData));
  }, [sessionData]);

  useEffect(() => {
    if (!sessionData) return;
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
  }, [sessionData]);

  const dispensarSaudacao = async () => {
    setSaudacao(false);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (uid) {
      await supabase.from("profiles").update({ primeiro_acesso: false }).eq("id", uid);
    }
  };

  if (isLoading) {
    return (
      <div id="profile-screen">
        <div className="ps-vesta">✦ Vesta ✦</div>
        <div className="ps-subtitle">Carregando…</div>
      </div>
    );
  }

  const soberana = isVestaSoberana(sessionData);

  const loggedAs: PersonaId = soberana
    ? "cinthia"
    : sessionData?.role === "vesta"
      ? (`member:${sessionData?.profile?.id}` as PersonaId)
      : sessionData?.profile
        ? keyForProfile(sessionData.profile.id, sessionData.profile.email)
        : "paulo";

  const scope = scopes[loggedAs] ?? { seeConsolidado: false, seePersonae: [] };
  const allowed = allowedForSession(sessionData, scopes);
  const visibleMembers = membersForRole(sessionData);

  // Membro com só uma visão disponível → pula o seletor, cai direto na carteira
  const effectiveProfile: ProfileId | null =
    profile ?? (allowed.length === 1 ? allowed[0] : null);

  const doLogout = async () => {
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

  if (!effectiveProfile) {
    return (
      <>
        {saudacaoOverlay}
        <ProfileSelector
          allowed={allowed}
          loggedAs={loggedAs}
          onSelect={setProfile}
          onLogout={doLogout}
          extras={visibleMembers}
          groupByDomus={soberana}
        />
      </>
    );
  }

  if (!allowed.includes(effectiveProfile)) {
    setProfile(null);
    return null;
  }

  return (
    <>
      {saudacaoOverlay}
      <VestaShell
        profileId={effectiveProfile}
        loggedAs={loggedAs}
        scopes={scopes}
        onUpdateScopes={
          getPersonaInfo(loggedAs).role === "vesta" ? setScopes : undefined
        }
        profileIdForScopeKey={(key: string) => profileIdForKey(key, sessionData)}
        onChangeProfile={setProfile}
        onSwitchProfile={() => {
          if (allowed.length > 1) setProfile(null);
          else doLogout();
        }}
        onLogout={doLogout}
      />
    </>
  );
}
