import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ProfileSelector, VestaShell } from "@/components/vesta/shell";
import { LoginScreen } from "@/components/vesta/login";
import type { ProfileId } from "@/lib/profile-derive";
import {
  DEFAULT_SCOPES,
  PERSONAE,
  allowedProfiles,
  type PersonaId,
  type Scope,
} from "@/state/session";

export const Route = createFileRoute("/")({
  component: VestaApp,
});

function VestaApp() {
  const [loggedAs, setLoggedAs] = useState<PersonaId | null>(null);
  const [scopes, setScopes] = useState<Record<PersonaId, Scope>>(DEFAULT_SCOPES);
  const [profile, setProfile] = useState<ProfileId | null>(null);

  // 1) Login mockado
  if (!loggedAs) {
    return (
      <LoginScreen
        onLogin={(id) => {
          setLoggedAs(id);
          setProfile(null);
        }}
      />
    );
  }

  const scope = scopes[loggedAs];
  const allowed = allowedProfiles(loggedAs, scope);

  // 2) Se o membro só pode ver a própria carteira, pula o seletor.
  const effectiveProfile: ProfileId | null =
    profile ?? (allowed.length === 1 ? allowed[0] : null);

  const doLogout = () => {
    setLoggedAs(null);
    setProfile(null);
  };

  // 3) Seletor filtrado por escopo
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

  // 4) Guard: se por algum motivo o profile atual não é mais permitido, volta pro seletor.
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
        // Só a Vesta gere escopos.
        PERSONAE[loggedAs].role === "vesta" ? setScopes : undefined
      }
      onChangeProfile={setProfile}
      onSwitchProfile={() => {
        if (allowed.length > 1) setProfile(null);
        else doLogout();
      }}
    />
  );
}
