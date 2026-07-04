import { createFileRoute } from "@tanstack/react-router";
import { PageShell, EmptyPanel } from "@/components/page-shell";

export const Route = createFileRoute("/metas")({
  component: () => (
    <PageShell
      title="Metas"
      description="Objetivos financeiros de curto, médio e longo prazo."
    >
      <EmptyPanel
        title="Em breve"
        hint="Crie objetivos e acompanhe o progresso automaticamente."
        className="min-h-[320px]"
      />
    </PageShell>
  ),
});
