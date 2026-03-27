import { Link } from 'react-router-dom'
import { DashboardMetrics } from '@/components/DashboardMetrics'
import { DashboardChart } from '@/components/DashboardChart'
import { DashboardRecentActivity } from '@/components/DashboardRecentActivity'
import { DashboardTopItemsChart } from '@/components/DashboardTopItemsChart'
import { DashboardExpiringItems } from '@/components/DashboardExpiringItems'
import { Button } from '@/components/ui/button'
import { Users, ArrowRight, Package } from 'lucide-react'

export default function Index() {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Visão Geral - JP Sistemas
        </h2>
        <p className="text-muted-foreground">
          Bem-vindo. Selecione o módulo que deseja acessar ou acompanhe o resumo abaixo.
        </p>
      </div>

      {/* Módulo de Equipe e Escalas (Separado do Almoxarifado) */}
      <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full text-blue-600 dark:text-blue-400 shrink-0">
            <Users className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-950 dark:text-blue-100">
              Módulo de Gestão de Pessoal
            </h3>
            <p className="text-sm text-blue-700/80 dark:text-blue-300/80 mt-1 max-w-xl leading-relaxed">
              Acesso exclusivo e independente para controle de profissionais, registro de férias,
              folgas e distribuição de escalas de trabalho da equipe de saúde.
            </p>
          </div>
        </div>
        <Button
          asChild
          size="lg"
          className="shrink-0 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Link to="/equipe">
            Painel de Férias e Escalas
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Módulo de Almoxarifado */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border/60">
          <Package className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          <h3 className="text-xl font-medium tracking-tight text-foreground">
            Painel do Almoxarifado
          </h3>
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
    </div>
  )
}
