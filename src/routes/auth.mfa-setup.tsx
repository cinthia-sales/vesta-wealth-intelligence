import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/mfa-setup")({
  beforeLoad: () => {
    throw redirect({ to: "/auth", search: { next: "/app" } });
  },
});