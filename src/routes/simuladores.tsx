import { createFileRoute } from "@tanstack/react-router";
import { PageShell, EmptyPanel } from "@/components/page-shell";

export const Route = createFileRoute("/simuladores")({
  component: () => (
    <PageShell
      title="Simuladores"
      description="Projeções de aposentadoria, financiamento, independência e cenários."
    >
      <EmptyPanel
        title="Em breve"
        hint="Compare cenários e antecipe o impacto de cada decisão."
        className="min-h-[320px]"
      />
    </PageShell>
  ),
});
