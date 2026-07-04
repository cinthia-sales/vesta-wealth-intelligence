import { createFileRoute } from "@tanstack/react-router";
import { PageShell, EmptyPanel } from "@/components/page-shell";

export const Route = createFileRoute("/patrimonio")({
  component: () => (
    <PageShell
      title="Patrimônio"
      description="Visão consolidada do patrimônio da família e por titular."
    >
      <EmptyPanel
        title="Em breve"
        hint="Aqui você verá a consolidação de investimentos, imóveis, veículos e demais ativos."
        className="min-h-[320px]"
      />
    </PageShell>
  ),
});
