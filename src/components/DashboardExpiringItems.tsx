import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { formatItemDisplay } from '@/utils/itemFormat'
import { getNearestExpiry } from '@/utils/expiryLogic'

export function DashboardExpiringItems() {
  const { items, movements } = useInventoryStore()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiringList = items
    .map((item) => {
      const nearest = getNearestExpiry(item, movements)
      if (!nearest) return null

      const diffDays = (nearest.date.getTime() - today.getTime()) / (1000 * 3600 * 24)

      if (diffDays <= 120) {
        return {
          item,
          nearestExpiry: nearest.date,
          batch: nearest.batch,
          diffDays,
          isExpired: diffDays < 0,
        }
      }
      return null
    })
    .filter(Boolean) as Array<{
    item: any
    nearestExpiry: Date
    batch: string | null | undefined
    diffDays: number
    isExpired: boolean
  }>

  expiringList.sort((a, b) => a.nearestExpiry.getTime() - b.nearestExpiry.getTime())

  const displayList = expiringList.slice(0, 5)

  return (
    <Card className="col-span-1 lg:col-span-1 flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Alertas de Validade
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {displayList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum item com lote ativo próximo ao vencimento ou vencido.
            </p>
          ) : (
            displayList.map((data, index) => {
              const { item, nearestExpiry, batch, isExpired, diffDays } = data

              return (
                <div
                  key={`${item.id}-${index}`}
                  className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-full mt-0.5 shrink-0 ${isExpired ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100' : diffDays <= 120 && diffDays > 60 ? 'bg-yellow-100 text-yellow-600' : 'bg-orange-100 text-orange-600'}`}
                    >
                      <CalendarIcon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm leading-tight mb-1 truncate">
                        {formatItemDisplay(item)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Vence: {format(nearestExpiry, 'dd/MM/yyyy')}
                        {batch && ` • Lote: ${batch}`}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={isExpired ? 'default' : 'default'}
                    className={`shrink-0 ml-2 border-transparent ${isExpired ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200' : diffDays <= 120 && diffDays > 60 ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                  >
                    {isExpired
                      ? 'Vencido'
                      : diffDays <= 120 && diffDays > 60
                        ? '≤ 120 Dias'
                        : '≤ 60 Dias'}
                  </Badge>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
