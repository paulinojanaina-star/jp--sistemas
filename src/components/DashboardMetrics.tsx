import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getNearestExpiry } from '@/utils/expiryLogic'
import {
  Package,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  CalendarClock,
} from 'lucide-react'

export function DashboardMetrics() {
  const { items, movements } = useInventoryStore()

  const totalItems = items.length
  const criticalStock = items.filter((i) => i.current_quantity < i.min_quantity).length

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyMovements = movements.filter((m) => {
    const d = new Date(m.created_at)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const monthlyIn = monthlyMovements
    .filter((m) => m.type === 'IN')
    .reduce((sum, m) => sum + m.quantity, 0)
  const monthlyOut = monthlyMovements
    .filter((m) => m.type === 'OUT')
    .reduce((sum, m) => sum + m.quantity, 0)

  // Calculate Stale Items (> 30 days without OUT movements)
  const now = new Date()
  const staleItems = items.filter((item) => {
    if (item.current_quantity <= 0) return false
    const outs = movements.filter((m) => m.item_id === item.id && m.type === 'OUT')
    let lastDateStr = item.created_at
    if (outs.length > 0) {
      lastDateStr = outs.reduce((latest, current) =>
        new Date(current.created_at) > new Date(latest.created_at) ? current : latest,
      ).created_at
    }
    const days = Math.floor(
      (now.getTime() - new Date(lastDateStr || now).getTime()) / (1000 * 3600 * 24),
    )
    return days >= 30
  }).length

  // Calculate Expiring Items (<= 180 days) using active batches
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const itemsExpiringCount = items.filter((item) => {
    const nearest = getNearestExpiry(item, movements)
    if (!nearest) return false
    const diffDays = (nearest.date.getTime() - today.getTime()) / (1000 * 3600 * 24)
    return diffDays <= 180
  }).length

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalItems}</div>
          <p className="text-xs text-muted-foreground mt-1">Registrados no banco</p>
        </CardContent>
      </Card>

      <Card
        className={
          criticalStock > 0 ? 'border-destructive/50 bg-destructive/5 dark:bg-destructive/10' : ''
        }
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle
            className={`text-sm font-medium ${criticalStock > 0 ? 'text-destructive font-bold' : ''}`}
          >
            Estoque Crítico
          </CardTitle>
          <AlertTriangle
            className={`h-4 w-4 ${criticalStock > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
          />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${criticalStock > 0 ? 'text-destructive' : ''}`}>
            {criticalStock}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Abaixo do nível mínimo</p>
        </CardContent>
      </Card>

      <Card
        className={
          itemsExpiringCount > 0 ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10' : ''
        }
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle
            className={`text-sm font-medium ${itemsExpiringCount > 0 ? 'text-amber-600 dark:text-amber-500 font-bold' : ''}`}
          >
            Vencimento Próximo
          </CardTitle>
          <CalendarClock
            className={`h-4 w-4 ${itemsExpiringCount > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground'}`}
          />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${itemsExpiringCount > 0 ? 'text-amber-600 dark:text-amber-500' : ''}`}
          >
            {itemsExpiringCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Lotes ativos a vencer &le; 180 dias</p>
        </CardContent>
      </Card>

      <Card
        className={staleItems > 0 ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10' : ''}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle
            className={`text-sm font-medium ${staleItems > 0 ? 'text-amber-600 dark:text-amber-500 font-bold' : ''}`}
          >
            Itens Ociosos
          </CardTitle>
          <Clock
            className={`h-4 w-4 ${staleItems > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground'}`}
          />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${staleItems > 0 ? 'text-amber-600 dark:text-amber-500' : ''}`}
          >
            {staleItems}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Sem saída há &gt; 30 dias</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entradas (Mês)</CardTitle>
          <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {monthlyIn}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Unidades recebidas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saídas (Mês)</CardTitle>
          <ArrowUpFromLine className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{monthlyOut}</div>
          <p className="text-xs text-muted-foreground mt-1">Unidades distribuídas</p>
        </CardContent>
      </Card>
    </div>
  )
}
