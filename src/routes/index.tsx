import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: VestaApp,
});

function VestaApp() {
  return (
    <iframe
      src="/vesta.html"
      title="Vesta — Guardiã do Patrimônio"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: 0,
        display: "block",
      }}
    />
  );
}
