import { DashboardMetrics } from '@/components/DashboardMetrics'
import { DashboardChart } from '@/components/DashboardChart'
import { DashboardRecentActivity } from '@/components/DashboardRecentActivity'

export default function Index() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Visão Geral - JP Sistemas
        </h2>
        <p className="text-muted-foreground">
          Bem-vindo ao painel de controle de estoque da unidade.
        </p>
      </div>

      <DashboardMetrics />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <DashboardChart />
        <DashboardRecentActivity />
      </div>
    </div>
  )
}
