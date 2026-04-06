import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { FileText, Download, Loader2, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { formatItemDisplay } from '@/utils/itemFormat'
import { getNearestExpiry } from '@/utils/expiryLogic'
import { exportDetailsPdf, exportDetailsExcel } from '@/utils/exportPdf'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ItemDetailsReport() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: items, error: itemsError } = await supabase.from('items').select('*')
      if (itemsError) throw itemsError

      const { data: movements, error: movementsError } = await supabase
        .from('inventory_movements')
        .select('*')
      if (movementsError) throw movementsError

      const details = items.map((item) => {
        const nearest = getNearestExpiry(item, movements || [])
        return {
          ...item,
          nearestExpiry: nearest ? nearest.date : null,
        }
      })

      details.sort((a, b) => formatItemDisplay(a).localeCompare(formatItemDisplay(b), 'pt-BR'))
      setData(details)
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar detalhes',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Detalhes e Especificações</h2>
          <p className="text-muted-foreground">
            Visualize as observações e a validade mais próxima de cada item do catálogo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportDetailsPdf(data)} disabled={loading}>
            <FileText className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => exportDetailsExcel(data)} disabled={loading}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px] rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                <TableRow>
                  <TableHead className="w-[300px]">Item</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Validade Mais Próxima</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      Nenhum item encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          {formatItemDisplay(item)}
                        </div>
                      </TableCell>
                      <TableCell>{item.unit_type || '-'}</TableCell>
                      <TableCell>
                        {item.nearestExpiry ? (
                          <span
                            className={
                              item.nearestExpiry <= new Date() ? 'text-destructive font-bold' : ''
                            }
                          >
                            {item.nearestExpiry.toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-medium">
                            Tempo Indeterminado
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[400px]">{item.description || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
