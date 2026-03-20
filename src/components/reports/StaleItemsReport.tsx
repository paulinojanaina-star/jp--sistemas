import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatItemDisplay } from '@/utils/itemFormat'

export function StaleItemsReport() {
  const { items, movements } = useInventoryStore()

  const now = new Date()
  const staleItems = items
    .map((item) => {
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
      return { ...item, daysStale: days }
    })
    .filter((item) => item.daysStale >= 30 && Number(item.current_quantity) > 0)
    .sort((a, b) => b.daysStale - a.daysStale)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Itens sem Movimentação (&gt; 30 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        {staleItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum item ocioso encontrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Dias Ocioso</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staleItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{formatItemDisplay(item)}</TableCell>
                  <TableCell className="text-right text-amber-600 font-bold">
                    {item.daysStale} dias
                  </TableCell>
                  <TableCell className="text-right">{item.current_quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
