import { useState } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { ItemFormModal } from '@/components/ItemFormModal'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Search, AlertCircle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function Items() {
  const { items } = useInventoryStore()
  const [search, setSearch] = useState('')

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Catálogo de Itens</h2>
          <p className="text-muted-foreground">
            Gerencie todos os materiais e medicamentos da unidade.
          </p>
        </div>
        <ItemFormModal />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou categoria..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Item</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
                <TableHead className="w-[200px]">Nível de Estoque</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Nenhum item encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.currentStock < item.minStock
                  const percentage = Math.min(
                    100,
                    Math.max(0, (item.currentStock / (item.minStock * 2 || 1)) * 100),
                  )

                  return (
                    <TableRow
                      key={item.id}
                      className={isLow ? 'bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50/50' : ''}
                    >
                      <TableCell>
                        <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          {item.name}
                          {isLow && <AlertCircle className="h-4 w-4 text-destructive" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{item.unit}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-mono text-base ${isLow ? 'text-destructive font-bold' : 'font-medium'}`}
                        >
                          {item.currentStock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                            <span>Min: {item.minStock}</span>
                            <span>{percentage > 100 ? '+100' : Math.round(percentage)}%</span>
                          </div>
                          <Progress
                            value={percentage}
                            className={`h-1.5 ${isLow ? 'bg-red-100 dark:bg-red-950 [&>div]:bg-destructive' : '[&>div]:bg-emerald-500'}`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
