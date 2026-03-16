import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'

export function DashboardRecentActivity() {
  const { movements, items } = useInventoryStore()
  const recent = movements.slice(0, 5)

  return (
    <Card className="col-span-1 lg:col-span-1 flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma movimentação recente.
            </p>
          ) : (
            recent.map((m) => {
              const item = items.find((i) => i.id === m.itemId)
              const isEntry = m.type === 'ENTRADA'

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-full mt-0.5 ${isEntry ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-primary'}`}
                    >
                      {isEntry ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
                    </div>
                    <div>
                      <p className="font-medium text-sm leading-tight mb-1">
                        {item?.name || 'Item Desconhecido'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR')} •{' '}
                        {m.responsible}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={isEntry ? 'outline' : 'default'}
                    className={`font-mono ${isEntry ? 'text-emerald-600 border-emerald-200' : ''}`}
                  >
                    {isEntry ? '+' : '-'}
                    {m.quantity}
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
