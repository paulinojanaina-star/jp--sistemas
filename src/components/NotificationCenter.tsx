import { useNotificationStore } from '@/stores/useNotificationStore'
import { Bell, Check, AlertTriangle, PackageOpen, TrendingDown, CalendarClock } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useTeamStore } from '@/stores/useTeamStore'
import { formatDistanceToNow, parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { calculateConsumption } from '@/utils/consumptionLogic'
import { getNearestExpiry } from '@/utils/expiryLogic'

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore()
  const { items, movements } = useInventoryStore()
  const { timeOffRequests } = useTeamStore()

  const lowStockItems = items.filter((i) => (i.current_quantity || 0) < (i.min_quantity || 0))

  const itemsAtRisk = items
    .map((item) => ({ item, ...calculateConsumption(item, movements) }))
    .filter((x) => x.isStockoutRisk)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiringItems = items
    .map((item) => {
      if ((item.current_quantity || 0) === 0) return null
      const nearest = getNearestExpiry(item, movements)
      if (!nearest) return null
      const diffDays = (nearest.date.getTime() - today.getTime()) / (1000 * 3600 * 24)
      if (diffDays >= 0 && diffDays <= 120) {
        return { item, diffDays, date: nearest.date }
      }
      return null
    })
    .filter(Boolean) as Array<{ item: any; diffDays: number; date: Date }>

  expiringItems.sort((a, b) => a.diffDays - b.diffDays)

  const expiring60 = expiringItems.filter((i) => i.diffDays <= 60)
  const expiring120 = expiringItems.filter((i) => i.diffDays > 60 && i.diffDays <= 120)

  const todayStr = new Date().toISOString().split('T')[0]
  const nextWeekDate = new Date()
  nextWeekDate.setDate(nextWeekDate.getDate() + 7)
  const nextWeekStr = nextWeekDate.toISOString().split('T')[0]

  const upcomingTimeOffs = timeOffRequests
    .filter((r) => r.start_date > todayStr && r.start_date <= nextWeekStr)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  const unreadNotifications = notifications.filter((n) => !n.read_at)

  // Badge alert count should only consider actual database unread notifications
  // This ensures the badge is disabled when the user reads them.
  const totalAlerts = unreadCount

  const hasAnyAlerts =
    unreadCount > 0 ||
    lowStockItems.length > 0 ||
    itemsAtRisk.length > 0 ||
    expiring60.length > 0 ||
    expiring120.length > 0 ||
    upcomingTimeOffs.length > 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-muted outline-none"
        >
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          {totalAlerts > 0 ? (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center border-2 border-card">
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          ) : upcomingTimeOffs.length > 0 ? (
            <span
              className="absolute top-1 right-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-card"
              title="Ausências próximas"
            />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0 shadow-lg border-muted">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold text-sm">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-0 text-xs text-primary hover:bg-transparent hover:underline"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {!hasAnyAlerts ? (
            <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
              <div className="bg-muted p-3 rounded-full">
                <Check className="h-6 w-6 text-slate-400" />
              </div>
              <p>Nenhuma notificação no momento.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {unreadNotifications.length > 0 && (
                <div className="p-2 border-b">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                    Novos Alertas
                  </p>
                  {unreadNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className="flex flex-col gap-1 p-2.5 rounded-md transition-colors bg-primary/5 cursor-pointer hover:bg-primary/10"
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                        <div className="flex flex-col gap-1.5 flex-1">
                          <p className="text-sm font-semibold leading-none">{n.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[10px] font-medium text-slate-400">
                            {formatDistanceToNow(new Date(n.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {lowStockItems.length > 0 && (
                <div className="p-2 border-b">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                    Estoque Crítico (Acompanhamento)
                  </p>
                  {lowStockItems.map((item) => (
                    <div
                      key={`low-${item.id}`}
                      className="flex flex-col items-start gap-1 p-2.5 rounded-md hover:bg-muted/50 cursor-default"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <PackageOpen className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="font-medium text-sm truncate">{item.name}</span>
                      </div>
                      <span className="text-xs text-destructive font-medium ml-6">
                        Saldo: {item.current_quantity} / Mínimo: {item.min_quantity}{' '}
                        {item.unit_type}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {itemsAtRisk.length > 0 && (
                <div className="p-2 border-b bg-purple-500/5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 px-2 py-1.5">
                    Risco de Ruptura (&le; 40 dias)
                  </p>
                  {itemsAtRisk.map(({ item, daysUntilStockout, monthlyConsumption }) => (
                    <div
                      key={`risk-${item.id}`}
                      className="flex flex-col items-start gap-1 p-2.5 rounded-md hover:bg-purple-500/10 cursor-default"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <TrendingDown className="h-4 w-4 text-purple-500 shrink-0" />
                        <span className="font-medium text-sm truncate">{item.name}</span>
                      </div>
                      <span className="text-xs text-purple-600 font-medium ml-6">
                        Estoque acaba em ~{Math.round(daysUntilStockout)} dias (Saída/mês:{' '}
                        {monthlyConsumption})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {expiring60.length > 0 && (
                <div className="p-2 border-b bg-orange-500/5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 px-2 py-1.5">
                    Vencimento Crítico (&le; 60 dias)
                  </p>
                  {expiring60.map(({ item, diffDays, date }) => (
                    <div
                      key={`exp60-${item.id}`}
                      className="flex flex-col items-start gap-1 p-2.5 rounded-md hover:bg-orange-500/10 cursor-default"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <CalendarClock className="h-4 w-4 text-orange-500 shrink-0" />
                        <span className="font-medium text-sm truncate">{item.name}</span>
                      </div>
                      <span className="text-xs text-orange-600 font-medium ml-6">
                        Vence em {Math.round(diffDays)} dias ({format(date, 'dd/MM/yyyy')})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {expiring120.length > 0 && (
                <div className="p-2 border-b bg-yellow-500/5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-yellow-600 px-2 py-1.5">
                    Atenção: Vencimento (&le; 120 dias)
                  </p>
                  {expiring120.map(({ item, diffDays, date }) => (
                    <div
                      key={`exp120-${item.id}`}
                      className="flex flex-col items-start gap-1 p-2.5 rounded-md hover:bg-yellow-500/10 cursor-default"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <CalendarClock className="h-4 w-4 text-yellow-500 shrink-0" />
                        <span className="font-medium text-sm truncate">{item.name}</span>
                      </div>
                      <span className="text-xs text-yellow-600 font-medium ml-6">
                        Vence em {Math.round(diffDays)} dias ({format(date, 'dd/MM/yyyy')})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {upcomingTimeOffs.length > 0 && (
                <div className="p-2 bg-blue-500/5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 px-2 py-1.5">
                    Ausências (Próximos 7 dias)
                  </p>
                  {upcomingTimeOffs.map((req) => (
                    <div
                      key={`timeoff-${req.id}`}
                      className="flex flex-col items-start gap-1 p-2.5 rounded-md hover:bg-blue-500/10 cursor-default"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <CalendarClock className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="font-medium text-sm truncate">{req.employees?.name}</span>
                      </div>
                      <span className="text-xs text-blue-600 font-medium ml-6">
                        {req.type} - Início: {format(parseISO(req.start_date), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
