import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useAuth } from '@/hooks/use-auth'
import { Bell, Search, LogOut, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function Layout() {
  const { items, loading } = useInventoryStore()
  const { user, signOut } = useAuth()

  const lowStockItems = items.filter((i) => i.current_quantity < i.min_quantity)
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'
  const userInitials = userName.substring(0, 2).toUpperCase()

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b bg-card shadow-subtle z-10 sticky top-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-foreground" />
              <div className="hidden md:flex relative w-72 items-center">
                <Search className="absolute left-2.5 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar itens rapidamente..."
                  className="pl-9 h-9 bg-muted/50 border-transparent focus-visible:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-5">
              <DropdownMenu>
                <DropdownMenuTrigger className="relative outline-none hover:bg-muted p-2 rounded-full transition-colors">
                  <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  {lowStockItems.length > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center border-2 border-card">
                      {lowStockItems.length}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <div className="p-3 border-b font-medium text-sm">Alertas de Estoque</div>
                  {loading ? (
                    <div className="p-4 text-center text-muted-foreground">Carregando...</div>
                  ) : lowStockItems.length === 0 ? (
                    <div className="p-4 text-sm text-center text-muted-foreground">
                      Estoque regularizado.
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {lowStockItems.map((item) => (
                        <DropdownMenuItem
                          key={item.id}
                          className="flex flex-col items-start gap-1 p-3 border-b last:border-0 cursor-default"
                        >
                          <span className="font-semibold text-sm">{item.name}</span>
                          <span className="text-xs text-destructive font-medium flex items-center gap-1">
                            Abaixo do mínimo: {item.current_quantity} / {item.min_quantity}{' '}
                            {item.unit_type}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-medium leading-none truncate max-w-[120px]">
                        {userName}
                      </p>
                      <p className="text-xs text-muted-foreground">Sessão Ativa</p>
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm text-muted-foreground border-b mb-1 truncate">
                    {user?.email}
                  </div>
                  <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair do sistema
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto animate-fade-in-up">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Outlet />
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
