import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ProfileSelector, VestaShell } from "@/components/vesta/shell";
import type { ProfileId } from "@/lib/profile-derive";

export const Route = createFileRoute("/")({
  component: VestaApp,
});

function VestaApp() {
  const [profile, setProfile] = useState<ProfileId | null>(null);

  if (!profile) return <ProfileSelector onSelect={setProfile} />;
  return <VestaShell profileId={profile} onSwitchProfile={() => setProfile(null)} />;
}
