import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Wallet,
  Briefcase,
  ArrowLeftRight,
  Target,
  Brain,
  Calculator,
  FileText,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Patrimônio", url: "/patrimonio", icon: Wallet },
  { title: "Carteira", url: "/carteira", icon: Briefcase },
  { title: "Fluxo de Caixa", url: "/fluxo", icon: ArrowLeftRight },
  { title: "Metas", url: "/metas", icon: Target },
];

const toolsItems = [
  { title: "Intelligence", url: "/intelligence", icon: Brain },
  { title: "Simuladores", url: "/simuladores", icon: Calculator },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
];

const systemItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (path: string) =>
    path === "/" ? currentPath === "/" : currentPath.startsWith(path);

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
            V
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">Vesta</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Command Center
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Principal", mainItems)}
        {renderGroup("Ferramentas", toolsItems)}
        {renderGroup("Sistema", systemItems)}
      </SidebarContent>
    </Sidebar>
  );
}
