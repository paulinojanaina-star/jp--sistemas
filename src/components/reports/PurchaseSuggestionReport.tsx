import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Download, ShoppingCart, Loader2, ArrowDownToLine } from 'lucide-react'
import { formatItemDisplay } from '@/utils/itemFormat'
import { calculateConsumption } from '@/utils/consumptionLogic'
import { useToast } from '@/hooks/use-toast'
import { exportPurchaseSuggestionPdf } from '@/utils/exportPdf'

export function PurchaseSuggestionReport() {
  const { items, movements } = useInventoryStore()
  const [search, setSearch] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const suggestions = useMemo(() => {
    return items
      .map((item) => {
        const { monthlyConsumption } = calculateConsumption(item, movements)

        // Meta de estoque ideal = Estoque mínimo + Média de consumo de 1 mês
        const targetStock = Number(item.min_quantity) + Math.ceil(monthlyConsumption)
        const current = Number(item.current_quantity)

        const suggestion = Math.max(0, targetStock - current)

        return {
          ...item,
          monthlyConsumption,
          targetStock,
          suggestion,
          formattedName: formatItemDisplay(item),
        }
      })
      .filter((item) => item.suggestion > 0)
      .sort((a, b) => b.suggestion - a.suggestion)
  }, [items, movements])

  const filteredSuggestions = suggestions.filter((item) =>
    item.formattedName.toLowerCase().includes(search.toLowerCase()),
  )

  const handleExport = async () => {
    setIsExporting(true)
    const { error } = await exportPurchaseSuggestionPdf(filteredSuggestions)
    setIsExporting(false)

    if (error) {
      toast({
        title: 'Erro ao exportar',
        description:
          'Não foi possível gerar o PDF. Verifique se o bloqueador de pop-ups está ativo.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Sugestão de Compra
          </CardTitle>
          <CardDescription>
            Quantidades ideais sugeridas com base no estoque mínimo e no consumo médio mensal.
          </CardDescription>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting || filteredSuggestions.length === 0}
          variant="outline"
          className="shrink-0"
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exportar Lista
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar item..."
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
              <TableHead className="text-right">Estoque Mínimo</TableHead>
              <TableHead className="text-right">Média Mensal</TableHead>
              <TableHead className="text-right">Estoque Atual</TableHead>
              <TableHead className="text-right">Sugestão</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuggestions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {search
                    ? 'Nenhum item encontrado para a busca.'
                    : 'Estoque adequado. Nenhuma compra sugerida no momento.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSuggestions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.formattedName}
                    <div className="text-xs text-muted-foreground mt-0.5">{item.unit_type}</div>
                  </TableCell>
                  <TableCell className="text-right">{item.min_quantity}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.monthlyConsumption}
                  </TableCell>
                  <TableCell className="text-right font-medium">{item.current_quantity}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="default"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-sm px-2 py-0.5"
                    >
                      +{item.suggestion}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" asChild title="Registrar Entrada">
                      <Link to="/movimentacoes">
                        <ArrowDownToLine className="h-4 w-4 text-secondary" strokeWidth={1.5} />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
