import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ProfileSelector, VestaShell } from "@/components/vesta/shell";
import { supabase } from "@/integrations/supabase/client";
import type { ProfileId } from "@/lib/profile-derive";
import {
  DEFAULT_SCOPES,
  PERSONAE,
  allowedProfiles,
  type PersonaId,
  type Scope,
} from "@/state/session";
import { getMyRole } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/app")({
  component: VestaApp,
});

function VestaApp() {
  const navigate = useNavigate();
  const [scopes, setScopes] = useState<Record<PersonaId, Scope>>(DEFAULT_SCOPES);
  const [profile, setProfile] = useState<ProfileId | null>(null);
  const [saudacao, setSaudacao] = useState(false);

  const { data: roleData, isLoading } = useQuery({
    queryKey: ["my-role"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) return { role: null };
      return getMyRole();
    },
    retry: false,
  });

  useEffect(() => {
    if (!roleData) return;
    if (roleData.role === "vesta") return; // Vesta nunca é saudada — a Deusa não se cumprimenta
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
  }, [roleData]);

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

  const loggedAs: PersonaId = roleData?.role === "vesta" ? "cinthia" : "paulo";
  const scope = scopes[loggedAs];
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
          PERSONAE[loggedAs].role === "vesta" ? setScopes : undefined
        }
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
