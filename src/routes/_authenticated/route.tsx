import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const SIMPLE_AUTH_EMAILS = new Set(["phfurtadovr@yahoo.com.br", "dmalta256@gmail.com"]);
const SIMPLE_AUTH_KEY = "vesta_simple_auth_email";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    const simpleEmail = typeof window !== "undefined"
      ? window.localStorage.getItem(SIMPLE_AUTH_KEY)?.toLowerCase()
      : null;
    if (!data.user && simpleEmail && SIMPLE_AUTH_EMAILS.has(simpleEmail)) {
      return { user: { id: `simple:${simpleEmail}`, email: simpleEmail } };
    }
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: { next: location.pathname },
      });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
