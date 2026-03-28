import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  History,
  FileBarChart,
  Activity,
  Users,
  ShieldAlert,
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

  return (
    <Sidebar className="border-r border-border/40 shadow-2xl bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-2xl">
      <SidebarContent>
        <SidebarGroup>
          <div className="p-6 mb-6 mt-2 relative overflow-hidden rounded-2xl mx-3 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-xl">
            <div
              className="absolute inset-0 z-0 opacity-30 mix-blend-overlay"
              style={{
                backgroundImage:
                  'url("https://img.usecurling.com/p/400/200?q=abstract%20digital%20network&color=blue")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90 z-0" />

            <div className="relative z-10 flex flex-col gap-3">
              <Link
                to="/"
                className="flex items-center gap-3 text-white hover:opacity-90 transition-opacity group"
              >
                <div className="bg-primary p-2.5 rounded-xl text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)] group-hover:scale-105 transition-transform duration-300">
                  <ShieldAlert className="h-5 w-5 drop-shadow-sm" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <span className="font-black tracking-tight text-xl leading-none">
                    JP Sistemas
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mt-1">
                    Corporate Edition
                  </span>
                </div>
              </Link>
            </div>
          </div>

          <div className="px-5 mb-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Navegação Principal
            </span>
          </div>

          <SidebarMenu className="px-3 gap-1.5">
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
                      'font-extrabold mb-1 tracking-wide rounded-xl h-12 transition-all duration-300 relative overflow-hidden group',
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm border border-primary/20'
                        : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-foreground border border-transparent',
                    )}
                  >
                    <Link to={item.url} className="flex items-center gap-3 px-3">
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
                      )}
                      <item.icon
                        className={cn(
                          'h-5 w-5 transition-colors',
                          isActive ? 'text-primary' : 'text-slate-500 group-hover:text-primary',
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
