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
    if (sessionData.role === "vesta") return; // Vesta nunca é saudada — a Deusa não se cumprimenta
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

  const loggedAs: PersonaId =
    sessionData?.role === "vesta"
      ? "cinthia"
      : sessionData?.profile
        ? keyForProfile(sessionData.profile.id, sessionData.profile.email)
        : "paulo";
  const scope = scopes[loggedAs] ?? { seeConsolidado: false, seePersonae: [] };
  const allowed = allowedProfiles(loggedAs, scope);

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
          extras={sessionData?.members ?? []}
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
