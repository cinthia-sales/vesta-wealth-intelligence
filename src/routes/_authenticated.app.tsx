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

  const { data: roleData, isLoading } = useQuery({
    queryKey: ["my-role"],
    queryFn: () => getMyRole(),
  });

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

  if (!effectiveProfile) {
    return (
      <ProfileSelector
        allowed={allowed}
        loggedAs={loggedAs}
        onSelect={setProfile}
        onLogout={doLogout}
      />
    );
  }

  if (!allowed.includes(effectiveProfile)) {
    setProfile(null);
    return null;
  }

  return (
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
  );
}
