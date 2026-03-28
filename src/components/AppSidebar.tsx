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
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const location = useLocation()

  const navItems = [
    { title: 'Dashboard', url: '/almoxarifado', icon: LayoutDashboard },
    { title: 'Itens', url: '/itens', icon: Package },
    { title: 'Movimentações', url: '/movimentacoes', icon: ArrowRightLeft },
    { title: 'Histórico', url: '/historico', icon: History },
    { title: 'Equipe & Escalas', url: '/equipe', icon: Users },
    { title: 'Relatórios', url: '/relatorios', icon: FileBarChart },
    { title: 'Saúde dos Dados', url: '/saude-dados', icon: Activity },
  ]

  const moduleName = 'Menu Principal'

  return (
    <Sidebar className="border-r border-border/40 shadow-subtle bg-card/80 backdrop-blur-xl">
      <SidebarContent>
        <SidebarGroup>
          <div className="p-5 mb-4 mt-2">
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                className="flex items-center gap-3 text-foreground hover:opacity-80 transition-opacity group"
              >
                <div className="bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-xl text-primary-foreground shadow-elevation group-hover:scale-105 transition-transform duration-300">
                  <Leaf className="h-5 w-5 drop-shadow-sm" strokeWidth={2} />
                </div>
                <span className="font-extrabold tracking-tight text-xl">JP Sistemas</span>
              </Link>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 mt-3">
                {moduleName}
              </span>
            </div>
          </div>
          <SidebarMenu className="px-3 gap-1">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.url ||
                (item.url !== '/' && location.pathname.startsWith(item.url + '/'))

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={cn(
                      'font-semibold mb-1 tracking-wide rounded-xl h-11 transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Link to={item.url} className="flex items-center gap-3 px-3">
                      <item.icon
                        className={cn(
                          'h-4 w-4',
                          isActive ? 'text-primary' : 'text-muted-foreground',
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
