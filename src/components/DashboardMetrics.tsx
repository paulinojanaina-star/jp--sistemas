import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'

export function DashboardMetrics() {
  const { items, movements } = useInventoryStore()

  const totalItems = items.length
  const criticalStock = items.filter((i) => i.currentStock < i.minStock).length

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyMovements = movements.filter((m) => {
    const d = new Date(m.date + 'T00:00:00')
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const monthlyIn = monthlyMovements
    .filter((m) => m.type === 'ENTRADA')
    .reduce((sum, m) => sum + m.quantity, 0)
  const monthlyOut = monthlyMovements
    .filter((m) => m.type === 'SAIDA')
    .reduce((sum, m) => sum + m.quantity, 0)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalItems}</div>
          <p className="text-xs text-muted-foreground mt-1">Registrados no catálogo</p>
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
