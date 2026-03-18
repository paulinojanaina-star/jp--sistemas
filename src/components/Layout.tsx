import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useAuth } from '@/hooks/use-auth'
import { Search, LogOut, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NotificationCenter } from './NotificationCenter'

export default function Layout() {
  const { loading } = useInventoryStore()
  const { user, signOut } = useAuth()

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
              <NotificationCenter />

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
