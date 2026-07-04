import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, TrendingUp, Bell, Sparkles } from "lucide-react";
import { PageShell, EmptyPanel } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: Home,
});

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight text-foreground">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Home() {
  return (
    <PageShell
      title="Boa noite 👋"
      description="Este é o seu centro de comando financeiro. Aqui você acompanhará a saúde do seu patrimônio em tempo real."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Patrimônio Total" value="R$ —" hint="Aguardando conexão de fontes" icon={ArrowUpRight} />
        <StatCard label="Rentabilidade (mês)" value="—" hint="Sem dados disponíveis" icon={TrendingUp} />
        <StatCard label="Rentabilidade (ano)" value="—" hint="Sem dados disponíveis" icon={TrendingUp} />
        <StatCard label="Alertas ativos" value="0" hint="Nenhum alerta no momento" icon={Bell} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Evolução do patrimônio</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyPanel
              title="Gráfico ainda não disponível"
              hint="Conecte suas primeiras fontes para visualizar a evolução mensal."
              className="min-h-[260px]"
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Resumo inteligente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyPanel
              title="Insights em breve"
              hint="O Vesta Intelligence vai destacar aqui os movimentos que exigem sua atenção."
              className="min-h-[260px]"
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Alertas recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyPanel title="Nenhum alerta por aqui" hint="Você está em dia." />
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Próximas metas</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyPanel title="Sem metas cadastradas" hint="Defina objetivos em Metas." />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
