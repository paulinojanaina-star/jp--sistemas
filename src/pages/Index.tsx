import { Link, useSearchParams } from 'react-router-dom'
import { DashboardMetrics } from '@/components/DashboardMetrics'
import { DashboardChart } from '@/components/DashboardChart'
import { DashboardRecentActivity } from '@/components/DashboardRecentActivity'
import { DashboardTopItemsChart } from '@/components/DashboardTopItemsChart'
import { DashboardExpiringItems } from '@/components/DashboardExpiringItems'
import { Button } from '@/components/ui/button'
import { Users, Package, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams()
  const showDashboard = searchParams.get('module') === 'almoxarifado'

  if (showDashboard) {
    return (
      <div className="space-y-8 animate-fade-in-up pb-8">
        <div className="flex items-center justify-between pb-6 border-b border-border/40">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 bg-background shadow-sm hover:shadow-md transition-all border-border/50"
              onClick={() => {
                searchParams.delete('module')
                setSearchParams(searchParams)
              }}
              title="Voltar"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                Painel Almoxarifado
              </h3>
              <p className="text-sm font-medium text-muted-foreground mt-1">
                Visão geral e métricas em tempo real
              </p>
            </div>
          </div>
        </div>

        <DashboardMetrics />

        <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
          <DashboardChart />
          <DashboardRecentActivity />
        </div>

        <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
          <DashboardTopItemsChart />
          <DashboardExpiringItems />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center animate-fade-in-up p-4">
      <div className="text-center space-y-6 mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] pointer-events-none -z-10" />

        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-primary to-primary/80 rounded-3xl shadow-elevation mb-2 transform hover:scale-105 transition-transform duration-500">
          <Sparkles className="h-10 w-10 text-primary-foreground" strokeWidth={1.5} />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Bem-vindo ao Workspace
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Selecione o módulo que deseja acessar para iniciar sua jornada de gestão inteligente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
        <Link
          to="/equipe"
          className="group relative bg-card hover:bg-card/90 border border-border/50 rounded-[2rem] p-10 flex flex-col items-center text-center gap-6 shadow-subtle hover:shadow-elevation transition-all duration-500 overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors duration-500" />

          <div className="bg-blue-50 dark:bg-blue-500/10 p-6 rounded-3xl text-blue-600 dark:text-blue-400 shrink-0 shadow-sm group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500">
            <Users className="h-12 w-12" strokeWidth={1.5} />
          </div>
          <div className="space-y-3 flex-1 relative z-10">
            <h3 className="text-2xl font-extrabold text-foreground">Gestão de Pessoal</h3>
            <p className="text-muted-foreground text-base font-medium leading-relaxed max-w-[280px]">
              Controle de profissionais, registro de férias, folgas e elaboração de escalas
              inteligentes.
            </p>
          </div>
          <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 font-bold text-lg group-hover:gap-3 transition-all">
            Acessar Módulo
            <ArrowRight className="ml-2 h-5 w-5" />
          </div>
        </Link>

        <button
          onClick={() => {
            searchParams.set('module', 'almoxarifado')
            setSearchParams(searchParams)
          }}
          className="group relative bg-card hover:bg-card/90 border border-border/50 rounded-[2rem] p-10 flex flex-col items-center text-center gap-6 shadow-subtle hover:shadow-elevation transition-all duration-500 overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 text-left"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors duration-500" />

          <div className="bg-emerald-50 dark:bg-emerald-500/10 p-6 rounded-3xl text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500">
            <Package className="h-12 w-12" strokeWidth={1.5} />
          </div>
          <div className="space-y-3 flex-1 relative z-10 flex flex-col items-center text-center w-full">
            <h3 className="text-2xl font-extrabold text-foreground w-full text-center">
              Almoxarifado
            </h3>
            <p className="text-muted-foreground text-base font-medium leading-relaxed max-w-[280px] text-center w-full">
              Inventário avançado, rastreio de estoque e controle preciso de movimentações diárias.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg group-hover:gap-3 transition-all w-full">
            Acessar Módulo
            <ArrowRight className="ml-2 h-5 w-5" />
          </div>
        </button>
      </div>
    </div>
  )
}
