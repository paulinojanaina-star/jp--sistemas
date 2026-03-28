import { Link, useSearchParams } from 'react-router-dom'
import { DashboardMetrics } from '@/components/DashboardMetrics'
import { DashboardChart } from '@/components/DashboardChart'
import { DashboardRecentActivity } from '@/components/DashboardRecentActivity'
import { DashboardTopItemsChart } from '@/components/DashboardTopItemsChart'
import { DashboardExpiringItems } from '@/components/DashboardExpiringItems'
import { Button } from '@/components/ui/button'
import { Users, Package, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'

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
              className="rounded-full h-11 w-11 bg-background shadow-sm hover:shadow-md transition-all border-border/50 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => {
                searchParams.delete('module')
                setSearchParams(searchParams)
              }}
              title="Voltar ao Workspace"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.5} />
            </Button>
            <div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                Painel Executivo: Suprimentos
              </h3>
              <p className="text-sm font-bold text-muted-foreground mt-1 tracking-wide">
                Visão consolidada e métricas de inteligência em tempo real
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
    <div className="min-h-[80vh] flex flex-col items-center justify-center animate-fade-in-up p-4 relative">
      <div className="text-center space-y-6 mb-16 relative z-10">
        <div className="inline-flex items-center justify-center p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] shadow-2xl mb-4 border border-slate-700 transform hover:scale-105 transition-transform duration-500">
          <ShieldCheck
            className="h-12 w-12 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]"
            strokeWidth={1.5}
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground drop-shadow-sm">
            Workspace Institucional
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl font-bold max-w-2xl mx-auto leading-relaxed">
            Selecione o módulo operacional desejado. O ambiente é monitorado e seguro.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl relative z-10">
        <Link
          to="/equipe"
          className="group relative rounded-[2.5rem] p-10 flex flex-col items-center text-center gap-6 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-border/50 bg-card/60 backdrop-blur-md hover:-translate-y-1"
        >
          <div
            className="absolute inset-0 z-0 opacity-10 group-hover:opacity-30 transition-opacity duration-700 mix-blend-luminosity"
            style={{
              backgroundImage:
                'url("https://img.usecurling.com/p/800/800?q=medical%20professionals%20team%20hospital&color=blue&dpr=2")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent z-0" />

          <div className="bg-blue-500/10 dark:bg-blue-500/20 p-6 rounded-[2rem] text-blue-600 dark:text-blue-400 shrink-0 shadow-inner group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500 relative z-10 backdrop-blur-xl border border-blue-500/20">
            <Users className="h-14 w-14" strokeWidth={1.5} />
          </div>
          <div className="space-y-4 flex-1 relative z-10 mt-2">
            <h3 className="text-3xl font-black text-foreground">Capital Humano</h3>
            <p className="text-muted-foreground text-base font-bold leading-relaxed max-w-[300px]">
              Gestão inteligente de escalas, registro de ausências e monitoramento corporativo de
              disponibilidade.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-lg group-hover:gap-4 transition-all w-full relative z-10 bg-blue-500/5 py-4 rounded-2xl border border-transparent group-hover:border-blue-500/10">
            Acessar Módulo
            <ArrowRight className="ml-2 h-6 w-6" strokeWidth={2.5} />
          </div>
        </Link>

        <button
          onClick={() => {
            searchParams.set('module', 'almoxarifado')
            setSearchParams(searchParams)
          }}
          className="group relative rounded-[2.5rem] p-10 flex flex-col items-center text-center gap-6 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-border/50 bg-card/60 backdrop-blur-md hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 text-left"
        >
          <div
            className="absolute inset-0 z-0 opacity-10 group-hover:opacity-30 transition-opacity duration-700 mix-blend-luminosity"
            style={{
              backgroundImage:
                'url("https://img.usecurling.com/p/800/800?q=modern%20warehouse%20clean%20medical&color=blue&dpr=2")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent z-0" />

          <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-6 rounded-[2rem] text-emerald-600 dark:text-emerald-400 shrink-0 shadow-inner group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500 relative z-10 backdrop-blur-xl border border-emerald-500/20">
            <Package className="h-14 w-14" strokeWidth={1.5} />
          </div>
          <div className="space-y-4 flex-1 relative z-10 flex flex-col items-center text-center w-full mt-2">
            <h3 className="text-3xl font-black text-foreground w-full text-center">Suprimentos</h3>
            <p className="text-muted-foreground text-base font-bold leading-relaxed max-w-[300px] text-center w-full">
              Inventário corporativo, rastreio de lotes e inteligência avançada sobre movimentações
              de estoque.
            </p>
          </div>
          <div className="mt-6 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-extrabold text-lg group-hover:gap-4 transition-all w-full relative z-10 bg-emerald-500/5 py-4 rounded-2xl border border-transparent group-hover:border-emerald-500/10">
            Acessar Módulo
            <ArrowRight className="ml-2 h-6 w-6" strokeWidth={2.5} />
          </div>
        </button>
      </div>
    </div>
  )
}
