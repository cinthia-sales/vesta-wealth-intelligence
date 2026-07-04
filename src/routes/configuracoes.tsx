import { createFileRoute } from "@tanstack/react-router";
import { PageShell, EmptyPanel } from "@/components/page-shell";

export const Route = createFileRoute("/configuracoes")({
  component: () => (
    <PageShell
      title="Configurações"
      description="Preferências, membros da família, fontes de dados e segurança."
    >
      <EmptyPanel
        title="Em breve"
        hint="Aqui você gerenciará conexões, permissões e preferências do Vesta."
        className="min-h-[320px]"
      />
    </PageShell>
  ),
});
