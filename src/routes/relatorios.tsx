import { createFileRoute } from "@tanstack/react-router";
import { PageShell, EmptyPanel } from "@/components/page-shell";

export const Route = createFileRoute("/relatorios")({
  component: () => (
    <PageShell
      title="Relatórios"
      description="Relatórios mensais, anuais e personalizados prontos para exportação."
    >
      <EmptyPanel
        title="Em breve"
        hint="Gere PDFs elegantes com a evolução do patrimônio da família."
        className="min-h-[320px]"
      />
    </PageShell>
  ),
});
