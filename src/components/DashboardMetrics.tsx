import { useNavigate } from 'react-router-dom'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getNearestExpiry } from '@/utils/expiryLogic'
import { calculateConsumption } from '@/utils/consumptionLogic'
import {
  Package,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  CalendarClock,
  TrendingDown,
} from 'lucide-react'

export function DashboardMetrics() {
  const { items, movements } = useInventoryStore()

  const totalItems = items.length
  const criticalStock = items.filter(
    (i) => Number(i.current_quantity) < Number(i.min_quantity),
  ).length

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyMovements = movements.filter((m) => {
    const d = new Date(m.created_at)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const monthlyIn = monthlyMovements
    .filter((m) => m.type === 'IN')
    .reduce((sum, m) => sum + Number(m.quantity), 0)
  const monthlyOut = monthlyMovements
    .filter((m) => m.type === 'OUT')
    .reduce((sum, m) => sum + Number(m.quantity), 0)

  // Calculate Stale Items (> 30 days without OUT movements)
  const now = new Date()
  const staleItems = items.filter((item) => {
    if (Number(item.current_quantity) <= 0) return false
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

  const navigate = useNavigate()

  // Calculate Expiring Items (<= 180 days) using active batches
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const itemsExpiringCount = items.filter((item) => {
    const nearest = getNearestExpiry(item, movements)
    if (!nearest) return false
    const diffDays = (nearest.date.getTime() - today.getTime()) / (1000 * 3600 * 24)
    return diffDays <= 180 && diffDays >= 0
  }).length

  // Calculate Expired Items (< 0 days)
  const itemsExpiredCount = items.filter((item) => {
    const nearest = getNearestExpiry(item, movements)
    if (!nearest) return false
    const diffDays = (nearest.date.getTime() - today.getTime()) / (1000 * 3600 * 24)
    return diffDays < 0
  }).length

  // Calculate Stockout Risk (<= 40 days)
  const itemsAtRiskCount = items.filter((item) => {
    const { isStockoutRisk } = calculateConsumption(item, movements)
    return isStockoutRisk
  }).length

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalItems}</div>
          <p className="text-xs text-muted-foreground mt-1">Registrados no banco</p>
        </CardContent>
      </Card>

      <Card className={criticalStock > 0 ? 'border-destructive/30 bg-destructive/5' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle
            className={`text-sm font-medium ${criticalStock > 0 ? 'text-destructive font-bold' : ''}`}
          >
            Estoque Crítico
          </CardTitle>
          <AlertTriangle
            className={`h-4 w-4 ${criticalStock > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
            strokeWidth={1.5}
          />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${criticalStock > 0 ? 'text-destructive' : ''}`}>
            {criticalStock}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Abaixo do nível mínimo</p>
        </CardContent>
      </Card>

      <Card className={itemsAtRiskCount > 0 ? 'border-purple-500/30 bg-purple-500/5' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle
            className={`text-sm font-medium ${itemsAtRiskCount > 0 ? 'text-purple-600 font-bold' : ''}`}
          >
            Risco de Ruptura
          </CardTitle>
          <TrendingDown
            className={`h-4 w-4 ${itemsAtRiskCount > 0 ? 'text-purple-600' : 'text-muted-foreground'}`}
            strokeWidth={1.5}
          />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${itemsAtRiskCount > 0 ? 'text-purple-600' : ''}`}>
            {itemsAtRiskCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Acabam em &le; 40 dias</p>
        </CardContent>
      </Card>

      <Card
        className={`cursor-pointer transition-colors hover:bg-destructive/10 ${itemsExpiredCount > 0 ? 'border-destructive/30 bg-destructive/5' : ''}`}
        onClick={() => navigate('/itens?filter=vencidos')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle
            className={`text-sm font-medium ${itemsExpiredCount > 0 ? 'text-destructive font-bold' : ''}`}
          >
            Itens Vencidos
          </CardTitle>
          <AlertTriangle
            className={`h-4 w-4 ${itemsExpiredCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
            strokeWidth={1.5}
          />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${itemsExpiredCount > 0 ? 'text-destructive' : ''}`}>
            {itemsExpiredCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Lotes com validade expirada</p>
        </CardContent>
      </Card>

      <Card
        className={`cursor-pointer transition-colors hover:bg-amber-500/10 ${itemsExpiringCount > 0 ? 'border-amber-500/30 bg-amber-500/5' : ''}`}
        onClick={() => navigate('/itens?filter=vencimento_proximo')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle
            className={`text-sm font-medium ${itemsExpiringCount > 0 ? 'text-amber-600 font-bold' : ''}`}
          >
            Vencimento Próximo
          </CardTitle>
          <CalendarClock
            className={`h-4 w-4 ${itemsExpiringCount > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}
            strokeWidth={1.5}
          />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${itemsExpiringCount > 0 ? 'text-amber-600' : ''}`}>
            {itemsExpiringCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Lotes ativos a vencer &le; 180 dias</p>
        </CardContent>
      </Card>

      <Card className={staleItems > 0 ? 'border-amber-500/30 bg-amber-500/5' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle
            className={`text-sm font-medium ${staleItems > 0 ? 'text-amber-600 font-bold' : ''}`}
          >
            Itens Ociosos
          </CardTitle>
          <Clock
            className={`h-4 w-4 ${staleItems > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}
            strokeWidth={1.5}
          />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${staleItems > 0 ? 'text-amber-600' : ''}`}>
            {staleItems}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Sem saída há &gt; 30 dias</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entradas (Mês)</CardTitle>
          <ArrowDownToLine className="h-4 w-4 text-secondary" strokeWidth={1.5} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-secondary">{monthlyIn}</div>
          <p className="text-xs text-muted-foreground mt-1">Unidades recebidas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saídas (Mês)</CardTitle>
          <ArrowUpFromLine className="h-4 w-4 text-primary" strokeWidth={1.5} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{monthlyOut}</div>
          <p className="text-xs text-muted-foreground mt-1">Unidades distribuídas</p>
        </CardContent>
      </Card>
    </div>
  )
}
