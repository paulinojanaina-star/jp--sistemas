import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useAuth } from '@/hooks/use-auth'
import { Search, LogOut, Loader2, ShieldCheck } from 'lucide-react'
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
      <div className="flex w-full min-h-screen bg-slate-50 dark:bg-slate-950 relative selection:bg-primary/20">
        {/* Subtle Premium Background */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.08] mix-blend-luminosity pointer-events-none"
          style={{
            backgroundImage:
              'url("https://img.usecurling.com/p/1920/1080?q=modern%20hospital%20architecture&color=blue&dpr=2")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        />

        <AppSidebar />

        <div className="flex flex-col flex-1 min-w-0 relative z-10">
          <header className="h-16 flex items-center justify-between px-6 lg:px-8 border-b border-border/40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl z-20 sticky top-0 shadow-sm transition-all">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-foreground transition-colors" />
              <div className="hidden md:flex relative w-80 items-center group">
                <Search className="absolute left-4 text-muted-foreground/70 h-4 w-4 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Buscar recursos e análises corporativas..."
                  className="pl-11 h-10 bg-slate-100/50 dark:bg-slate-900/50 border-transparent focus-visible:bg-background focus-visible:ring-primary/20 focus-visible:border-primary/30 rounded-full transition-all shadow-inner font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 lg:gap-6">
              <div className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative shadow-sm border border-transparent hover:border-border/50">
                <NotificationCenter />
              </div>

              <div className="h-6 w-px bg-border/60 hidden sm:block"></div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-extrabold leading-none text-foreground group-hover:text-primary transition-colors">
                        {userName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5 font-bold flex items-center justify-end gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" strokeWidth={2.5} />
                        Gestor Autorizado
                      </p>
                    </div>
                    <Avatar className="h-10 w-10 border-2 border-background shadow-md group-hover:border-primary/30 transition-all">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-black text-sm">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 rounded-xl shadow-2xl p-2 border-border/50 backdrop-blur-xl bg-background/95"
                >
                  <div className="px-3 py-3 mb-2 bg-slate-100 dark:bg-slate-900 rounded-lg flex flex-col gap-1 shadow-inner">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      Conta Conectada
                    </span>
                    <span className="text-sm font-bold text-foreground truncate">
                      {user?.email}
                    </span>
                  </div>
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg py-3 mt-1"
                  >
                    <LogOut className="mr-2 h-4 w-4" strokeWidth={2.5} />
                    <span className="font-extrabold">Encerrar Sessão Segura</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto animate-fade-in-up">
              {loading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground font-extrabold tracking-widest uppercase text-xs animate-pulse">
                      Sincronizando Workspace Corporativo...
                    </p>
                  </div>
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
