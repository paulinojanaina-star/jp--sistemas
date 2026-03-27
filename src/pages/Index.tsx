import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardMetrics } from '@/components/DashboardMetrics'
import { DashboardChart } from '@/components/DashboardChart'
import { DashboardRecentActivity } from '@/components/DashboardRecentActivity'
import { DashboardTopItemsChart } from '@/components/DashboardTopItemsChart'
import { DashboardExpiringItems } from '@/components/DashboardExpiringItems'
import { Button } from '@/components/ui/button'
import { Users, Package, ArrowLeft, ArrowRight, LayoutDashboard } from 'lucide-react'

export default function Index() {
  const [showDashboard, setShowDashboard] = useState(false)

  if (showDashboard) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex items-center gap-4 pb-3 border-b border-border/60">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDashboard(false)}
            title="Voltar para o Início"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            <h3 className="text-xl font-medium tracking-tight text-foreground">
              Painel do Almoxarifado
            </h3>
          </div>
        </div>

        <DashboardMetrics />

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <DashboardChart />
          <DashboardRecentActivity />
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <DashboardTopItemsChart />
          <DashboardExpiringItems />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center animate-fade-in-up p-4">
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
          <LayoutDashboard className="h-8 w-8 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Bem-vindo ao JP Sistemas
        </h2>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          Selecione abaixo qual módulo você deseja acessar para iniciar seus trabalhos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Módulo de Gestão de Pessoal */}
        <Link
          to="/equipe"
          className="group relative bg-card hover:bg-accent/5 border border-border/60 rounded-2xl p-8 flex flex-col items-center text-center gap-4 shadow-sm hover:shadow-md transition-all overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500 transition-opacity opacity-80 group-hover:opacity-100" />
          <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-full text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform duration-300">
            <Users className="h-10 w-10" strokeWidth={1.5} />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-2xl font-semibold text-foreground">Gestão de Pessoal</h3>
            <p className="text-muted-foreground leading-relaxed">
              Controle de profissionais, registro de férias, folgas e escalas de trabalho da equipe
              de saúde.
            </p>
          </div>
          <div className="mt-4 flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
            Acessar Módulo
            <ArrowRight className="ml-1 h-5 w-5" />
          </div>
        </Link>

        {/* Módulo de Almoxarifado */}
        <button
          onClick={() => setShowDashboard(true)}
          className="group relative bg-card hover:bg-accent/5 border border-border/60 rounded-2xl p-8 flex flex-col items-center text-center gap-4 shadow-sm hover:shadow-md transition-all overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500 transition-opacity opacity-80 group-hover:opacity-100" />
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-full text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform duration-300">
            <Package className="h-10 w-10" strokeWidth={1.5} />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="text-2xl font-semibold text-foreground">Almoxarifado</h3>
            <p className="text-muted-foreground leading-relaxed">
              Gestão de inventário, controle de estoque, registro de movimentações e acompanhamento
              de validades.
            </p>
          </div>
          <div className="mt-4 flex items-center text-emerald-600 font-medium group-hover:gap-2 transition-all">
            Acessar Módulo
            <ArrowRight className="ml-1 h-5 w-5" />
          </div>
        </button>
      </div>
    </div>
  )
}
