import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, ArrowRightLeft, History, HeartPulse } from 'lucide-react'
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

  const navItems = [
    { title: 'Início', url: '/', icon: LayoutDashboard },
    { title: 'Itens', url: '/itens', icon: Package },
    { title: 'Movimentações', url: '/movimentacoes', icon: ArrowRightLeft },
    { title: 'Histórico', url: '/historico', icon: History },
  ]

  return (
    <Sidebar className="border-r border-border shadow-sm">
      <SidebarContent>
        <SidebarGroup>
          <div className="p-4 mb-4 mt-2">
            <Link
              to="/"
              className="flex items-center gap-2 text-primary font-bold text-xl hover:opacity-90 transition-opacity"
            >
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <HeartPulse className="h-5 w-5" />
              </div>
              <span>SGE Saúde</span>
            </Link>
          </div>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.url}
                  className="font-medium mb-1"
                >
                  <Link to={item.url}>
                    <item.icon className="h-5 w-5" />
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
