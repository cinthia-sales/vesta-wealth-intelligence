import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      throw redirect({
        to: "/auth",
        search: { next: location.pathname },
      });
    }

    // Exige MFA (aal2). Se o usuário só tem aal1 e possui fator TOTP verificado, precisa desafiar.
    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aal?.currentLevel === "aal2") {
      return { user: userData.user };
    }

    // Se ainda não tem fator TOTP inscrito → força enroll
    // Se tem fator mas não verificou nesta sessão → força verify
    const { data: factors, error: factorsErr } =
      await supabase.auth.mfa.listFactors();
    if (factorsErr) {
      throw redirect({ to: "/auth", search: { next: location.pathname } });
    }
    const verifiedTotp = factors?.totp?.find((f) => f.status === "verified");
    if (!verifiedTotp) {
      throw redirect({
        to: "/auth/mfa-setup",
        search: { next: location.pathname },
      });
    }
    throw redirect({
      to: "/auth/mfa-verify",
      search: { next: location.pathname },
    });
  },
  component: () => <Outlet />,
});
