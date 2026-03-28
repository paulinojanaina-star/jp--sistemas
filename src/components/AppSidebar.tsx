import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  History,
  FileBarChart,
  Leaf,
  Activity,
  Users,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function AppSidebar() {
  const location = useLocation()

  const isPessoal = location.pathname.startsWith('/equipe')

  const almoxarifadoItems = [
    { title: 'Início', url: '/', icon: LayoutDashboard },
    { title: 'Itens', url: '/itens', icon: Package },
    { title: 'Movimentações', url: '/movimentacoes', icon: ArrowRightLeft },
    { title: 'Histórico', url: '/historico', icon: History },
    { title: 'Relatórios', url: '/relatorios', icon: FileBarChart },
    { title: 'Saúde dos Dados', url: '/saude-dados', icon: Activity },
  ]

  const pessoalItems = [
    { title: 'Início', url: '/', icon: LayoutDashboard },
    { title: 'Equipe & Escalas', url: '/equipe', icon: Users },
  ]

  const navItems = isPessoal ? pessoalItems : almoxarifadoItems
  const moduleName = isPessoal ? 'Gestão de Pessoal' : 'Almoxarifado'

  return (
    <Sidebar className="border-r border-border/60 shadow-sm bg-card/50">
      <SidebarContent>
        <SidebarGroup>
          <div className="p-4 mb-4 mt-2">
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                className="flex items-center gap-3 text-foreground hover:opacity-80 transition-opacity"
              >
                <div className="bg-primary/10 p-2.5 rounded-xl text-primary border border-primary/10 shadow-sm">
                  <Leaf className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <span className="font-light tracking-tight text-xl">JP Sistemas</span>
              </Link>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1 mt-2">
                {moduleName}
              </span>
            </div>
          </div>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.url}
                  className="font-medium mb-1 tracking-wide"
                >
                  <Link to={item.url}>
                    <item.icon className="h-4 w-4" strokeWidth={1.5} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
