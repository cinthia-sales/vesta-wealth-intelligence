import { createFileRoute } from "@tanstack/react-router";
import { PageShell, EmptyPanel } from "@/components/page-shell";

export const Route = createFileRoute("/intelligence")({
  component: () => (
    <PageShell
      title="Intelligence"
      description="Radar financeiro com sinais, oportunidades e riscos."
    >
      <EmptyPanel
        title="Em breve"
        hint="O motor de insights do Vesta vai monitorar seu patrimônio 24/7."
        className="min-h-[320px]"
      />
    </PageShell>
  ),
});
