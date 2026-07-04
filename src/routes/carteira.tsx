import { createFileRoute } from "@tanstack/react-router";
import { PageShell, EmptyPanel } from "@/components/page-shell";

export const Route = createFileRoute("/carteira")({
  component: () => (
    <PageShell
      title="Carteira"
      description="Investimentos consolidados por classe, corretora e ativo."
    >
      <EmptyPanel
        title="Em breve"
        hint="Conecte fontes de dados para visualizar sua carteira."
        className="min-h-[320px]"
      />
    </PageShell>
  ),
});
