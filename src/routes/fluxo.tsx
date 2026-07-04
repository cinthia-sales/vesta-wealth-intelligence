import { createFileRoute } from "@tanstack/react-router";
import { PageShell, EmptyPanel } from "@/components/page-shell";

export const Route = createFileRoute("/fluxo")({
  component: () => (
    <PageShell
      title="Fluxo de Caixa"
      description="Entradas, saídas e projeções de curto prazo."
    >
      <EmptyPanel
        title="Em breve"
        hint="Acompanhe receitas, despesas e saldo projetado por mês."
        className="min-h-[320px]"
      />
    </PageShell>
  ),
});
