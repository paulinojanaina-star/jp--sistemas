import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { formatItemDisplay } from '@/utils/itemFormat'
import { ExportButtons } from '@/components/ExportButtons'
import { GenericExportOptions } from '@/utils/exportGeneric'

export function DashboardRecentActivity() {
  const { movements } = useInventoryStore()
  const recent = movements.slice(0, 5)

  return (
    <Card className="col-span-1 lg:col-span-1 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Atividade Recente</CardTitle>
        <ExportButtons
          size="sm"
          disabled={recent.length === 0}
          options={(): GenericExportOptions<any> => ({
            filename: 'atividades-recentes-dashboard',
            title: 'Atividades Recentes de Movimentação (Dashboard)',
            data: recent,
            columns: [
              {
                header: 'Data / Hora',
                accessor: (m) => new Date(m.created_at).toLocaleString('pt-BR'),
              },
              {
                header: 'Tipo',
                accessor: (m) => (m.type === 'IN' ? 'Entrada' : 'Saída'),
              },
              {
                header: 'Item',
                accessor: (m) =>
                  m.items
                    ? formatItemDisplay({ name: m.items.name, id: m.item_id })
                    : 'Item Excluído',
              },
              {
                header: 'Quantidade',
                accessor: (m) => (m.type === 'IN' ? `+${m.quantity}` : `-${m.quantity}`),
                align: 'right',
              },
              {
                header: 'Responsável',
                accessor: (m) => m.profiles?.full_name || m.profiles?.email || 'Desconhecido',
              },
            ],
          })}
        />
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma movimentação recente no banco.
            </p>
          ) : (
            recent.map((m) => {
              const isEntry = m.type === 'IN'

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-full mt-0.5 shrink-0 ${isEntry ? 'bg-secondary/15 text-secondary' : 'bg-primary/10 text-primary'}`}
                    >
                      {isEntry ? (
                        <ArrowDownToLine size={14} strokeWidth={1.5} />
                      ) : (
                        <ArrowUpFromLine size={14} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm leading-tight mb-1 truncate">
                        {m.items
                          ? formatItemDisplay({ name: m.items.name, id: m.item_id })
                          : 'Item Excluído'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {new Date(m.created_at).toLocaleDateString('pt-BR')} •{' '}
                        {m.profiles?.full_name || m.profiles?.email || 'Desconhecido'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={isEntry ? 'outline' : 'default'}
                    className={`font-mono shrink-0 ml-2 ${isEntry ? 'text-secondary border-secondary/30' : ''}`}
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
