import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ArrowRightLeft, AlertTriangle, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function Almoxarifado() {
  const { items = [], movements = [] } = useInventoryStore() as any

  const lowStockItems = items.filter(
    (item: any) => (item.current_quantity || 0) <= (item.min_quantity || 0),
  )
  const totalItems = items.length
  const totalMovements = movements.length

  return (
    <div className="space-y-8 animate-fade-in-up pb-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
          Dashboard Almoxarifado
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl font-medium">
          Visão geral executiva do seu controle de estoque e últimas movimentações registradas.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Total de Itens',
            value: totalItems,
            desc: 'Itens cadastrados',
            icon: Package,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-100 dark:bg-blue-500/10',
          },
          {
            title: 'Estoque Crítico',
            value: lowStockItems.length,
            desc: 'Abaixo do mínimo',
            icon: AlertTriangle,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-100 dark:bg-rose-500/10',
            valueColor: 'text-rose-600 dark:text-rose-400',
          },
          {
            title: 'Movimentações',
            value: totalMovements,
            desc: 'Registros totais',
            icon: ArrowRightLeft,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-100 dark:bg-indigo-500/10',
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="rounded-3xl border-border/50 shadow-subtle hover:shadow-elevation transition-all duration-300 overflow-hidden group"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div
                className={cn(
                  'p-2.5 rounded-2xl transition-transform duration-300 group-hover:scale-110',
                  stat.bg,
                )}
              >
                <stat.icon className={cn('h-5 w-5', stat.color)} strokeWidth={2} />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div
                className={cn(
                  'text-4xl font-extrabold tracking-tight',
                  stat.valueColor || 'text-foreground',
                )}
              >
                {stat.value}
              </div>
              <p className="text-sm text-muted-foreground font-semibold mt-2 flex items-center gap-1">
                {stat.desc}
              </p>
            </CardContent>
          </Card>
        ))}

        <Card className="rounded-3xl border-border/50 shadow-subtle hover:shadow-elevation transition-all duration-300 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6">
            <CardTitle className="text-sm font-bold text-primary uppercase tracking-wider">
              Ações Rápidas
            </CardTitle>
            <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
              <TrendingUp className="h-5 w-5" strokeWidth={2} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-6 pb-6 pt-4">
            <Link
              to="/itens"
              className="flex items-center justify-between p-3 rounded-xl bg-card hover:bg-primary hover:text-primary-foreground border border-border/40 shadow-sm transition-all group font-bold text-sm"
            >
              Catálogo de Itens
              <ArrowRightLeft className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
            <Link
              to="/movimentacoes"
              className="flex items-center justify-between p-3 rounded-xl bg-card hover:bg-primary hover:text-primary-foreground border border-border/40 shadow-sm transition-all group font-bold text-sm"
            >
              Nova Movimentação
              <ArrowRightLeft className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
