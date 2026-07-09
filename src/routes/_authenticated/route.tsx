import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ACCESS_AUTH_KEY, isAccessEmail } from "@/lib/vesta-access-keys";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    const simpleEmail = typeof window !== "undefined"
      ? window.localStorage.getItem(ACCESS_AUTH_KEY)?.toLowerCase()
      : null;
    if (!data.user && isAccessEmail(simpleEmail)) {
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
