import { useNotificationStore } from '@/stores/useNotificationStore'
import { Bell, Check, AlertTriangle, PackageOpen } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore()
  const { items } = useInventoryStore()

  const lowStockItems = items.filter((i) => i.current_quantity < i.min_quantity)
  const totalAlerts = unreadCount + lowStockItems.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-muted outline-none"
        >
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          {totalAlerts > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center border-2 border-card">
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          )}
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
          {totalAlerts === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
              <div className="bg-muted p-3 rounded-full">
                <Check className="h-6 w-6 text-slate-400" />
              </div>
              <p>Nenhuma notificação no momento.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {lowStockItems.length > 0 && (
                <div className="p-2 border-b">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                    Estoque Baixo
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

              {notifications.length > 0 && (
                <div className="p-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                    Alertas de Consumo
                  </p>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.read_at && markAsRead(n.id)}
                      className={`flex flex-col gap-1 p-2.5 rounded-md transition-colors ${!n.read_at ? 'bg-primary/5 cursor-pointer hover:bg-primary/10' : 'opacity-70'}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle
                          className={`h-4 w-4 shrink-0 mt-0.5 ${!n.read_at ? 'text-destructive' : 'text-muted-foreground'}`}
                        />
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
                        {!n.read_at && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                        )}
                      </div>
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
