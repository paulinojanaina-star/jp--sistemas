import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Download, ShoppingCart, Loader2, ArrowDownToLine, RefreshCcw } from 'lucide-react'
import { formatItemDisplay } from '@/utils/itemFormat'
import { calculateConsumption } from '@/utils/consumptionLogic'
import { useToast } from '@/hooks/use-toast'
import { exportPurchaseSuggestionPdf, exportPurchaseSuggestionExcel } from '@/utils/exportPdf'

export function PurchaseSuggestionReport() {
  const { items, movements } = useInventoryStore()
  const [search, setSearch] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [customQuantities, setCustomQuantities] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const baseSuggestions = useMemo(() => {
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

  const filteredSuggestions = baseSuggestions
    .map((item) => ({
      ...item,
      finalSuggestion:
        customQuantities[item.id] !== undefined
          ? Number(customQuantities[item.id])
          : item.suggestion,
      customInput:
        customQuantities[item.id] !== undefined
          ? customQuantities[item.id]
          : item.suggestion.toString(),
    }))
    .filter((item) => item.formattedName.toLowerCase().includes(search.toLowerCase()))

  const handleQuantityChange = (id: string, value: string) => {
    setCustomQuantities((prev) => ({ ...prev, [id]: value }))
  }

  const handleResetQuantity = (id: string) => {
    setCustomQuantities((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true)
    const { error } =
      format === 'pdf'
        ? await exportPurchaseSuggestionPdf(filteredSuggestions)
        : await exportPurchaseSuggestionExcel(filteredSuggestions)
    setIsExporting(false)

    if (error) {
      toast({
        title: 'Erro ao exportar',
        description:
          'Não foi possível gerar o arquivo. Verifique se o bloqueador de pop-ups está ativo.',
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Exportação concluída!' })
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
            Quantidades ideais sugeridas. Você pode editar os valores caso queira comprar
            quantidades diferentes antes de exportar.
          </CardDescription>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
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
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              Exportar como PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel')}>
              Exportar como Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Estoque Mínimo</TableHead>
                <TableHead className="text-right">Média Mensal</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
                <TableHead className="text-right min-w-[140px]">Qtd a Comprar</TableHead>
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
                filteredSuggestions.map((item) => {
                  const isEdited = customQuantities[item.id] !== undefined

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.formattedName}
                        <div className="text-xs text-muted-foreground mt-0.5">{item.unit_type}</div>
                      </TableCell>
                      <TableCell className="text-right">{item.min_quantity}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.monthlyConsumption}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.current_quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isEdited && (
                            <div className="flex flex-col items-end mr-2">
                              <span className="text-[10px] text-muted-foreground leading-tight">
                                Sugestão: {item.suggestion}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 text-muted-foreground hover:text-foreground mt-0.5"
                                onClick={() => handleResetQuantity(item.id)}
                                title="Restaurar sugestão original"
                              >
                                <RefreshCcw className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          <Input
                            type="number"
                            min="0"
                            className={`w-20 text-right h-8 font-mono text-sm ${isEdited ? 'border-primary bg-primary/5' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'}`}
                            value={item.customInput}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" asChild title="Registrar Entrada">
                          <Link to={`/movimentacoes?item=${item.id}&qty=${item.finalSuggestion}`}>
                            <ArrowDownToLine className="h-4 w-4 text-secondary" strokeWidth={1.5} />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
