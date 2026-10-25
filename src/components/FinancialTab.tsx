import { useState, useMemo, useEffect } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ExportButtons } from '@/components/ExportButtons'
import { GenericExportOptions } from '@/utils/exportGeneric'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  DollarSign,
  Save,
  Loader2,
  LineChart as ChartLineIcon,
  Layers,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PriceHistoryView } from '@/components/purchases/PriceHistoryView'
import { fetchPriceHistory } from '@/services/priceHistory'
import { ItemPriceHistoryEntry } from '@/types/priceHistory'

export function FinancialTab() {
  const { items, updateItem } = useInventoryStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const [activeSubTab, setActiveSubTab] = useState<'estoque' | 'historico_precos'>('estoque')
  const [priceHistory, setPriceHistory] = useState<ItemPriceHistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedHistoryItemId, setSelectedHistoryItemId] = useState<string | undefined>(undefined)

  const loadHistory = async () => {
    setLoadingHistory(true)
    const { data } = await fetchPriceHistory()
    setPriceHistory(data || [])
    setLoadingHistory(false)
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [items, searchQuery])

  const totalGlobalValue = useMemo(() => {
    return items.reduce((acc, item) => {
      return acc + Number(item.current_quantity || 0) * Number(item.unit_price || 0)
    }, 0)
  }, [items])

  const handleSave = async (id: string) => {
    setSaving(true)
    const price = parseFloat(editValue.replace(',', '.'))
    const finalPrice = isNaN(price) ? 0 : price
    const { error } = await updateItem(id, { unit_price: finalPrice })

    if (error) {
      setSaving(false)
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o preço.',
        variant: 'destructive',
      })
      return
    }

    // Se o preço foi alterado e for positivo, registrar no histórico
    if (finalPrice > 0) {
      const targetItem = items.find((i) => i.id === id)
      try {
        const { supabase } = await import('@/lib/supabase/client')
        await (supabase as any).from('item_price_history').insert({
          item_id: id,
          supplier: targetItem?.supplier || 'Ajuste Manual',
          unit_price: finalPrice,
          quantity: Number(targetItem?.current_quantity) || 1,
          total_price: finalPrice * (Number(targetItem?.current_quantity) || 1),
          source_type: 'MANUAL_ADJUSTMENT',
          record_date: new Date().toISOString().split('T')[0],
        })
      } catch (e) {
        console.error('Erro ao registrar histórico manual:', e)
      }
    }

    setSaving(false)
    setEditingId(null)
    toast({ title: 'Sucesso', description: 'Preço unitário atualizado.' })
  }

  return (
    <div className="space-y-6">
      {/* Sub Tabs: Controle de Estoque vs Histórico e Curva de Preços */}
      <Tabs
        value={activeSubTab}
        onValueChange={(val) => setActiveSubTab(val as 'estoque' | 'historico_precos')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-[480px] mb-6">
          <TabsTrigger value="estoque" className="font-bold flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Valor em Estoque
          </TabsTrigger>
          <TabsTrigger value="historico_precos" className="font-bold flex items-center gap-2">
            <ChartLineIcon className="w-4 h-4" />
            Curva & Histórico de Preços
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estoque" className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6 col-span-1 md:col-span-1 bg-primary/5 border-primary/20 flex flex-col justify-center items-center rounded-2xl">
              <div className="flex items-center gap-2 text-primary font-bold mb-2">
                <DollarSign className="w-5 h-5" /> Valor Total em Estoque
              </div>
              <div className="text-3xl font-black text-foreground">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  totalGlobalValue,
                )}
              </div>
            </Card>
            <div className="col-span-1 md:col-span-2 flex flex-col justify-end">
              <div className="flex flex-wrap items-center gap-2 justify-end w-full">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar item..."
                    className="pl-9 rounded-xl bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <ExportButtons
                  disabled={filteredItems.length === 0}
                  options={(): GenericExportOptions<any> => ({
                    filename: 'controle-financeiro-estoque',
                    title: 'Controle Financeiro de Estoque',
                    subtitle: `Total Imobilizado: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGlobalValue)}`,
                    filters: [{ label: 'Pesquisa', value: searchQuery || 'Todos' }],
                    data: filteredItems,
                    columns: [
                      { header: 'Item', key: 'name' },
                      {
                        header: 'Quantidade',
                        accessor: (it) =>
                          `${Number(it.current_quantity || 0)} ${it.unit_type || 'UN'}`,
                        align: 'right',
                      },
                      {
                        header: 'Preço Unitário (R$)',
                        accessor: (it) =>
                          new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(Number(it.unit_price || 0)),
                        align: 'right',
                      },
                      {
                        header: 'Valor Total (R$)',
                        accessor: (it) =>
                          new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(Number(it.current_quantity || 0) * Number(it.unit_price || 0)),
                        align: 'right',
                      },
                    ],
                  })}
                />
              </div>
            </div>
          </div>
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <TableHead className="font-bold h-12">Item</TableHead>
                  <TableHead className="font-bold h-12 text-center">Quantidade</TableHead>
                  <TableHead className="font-bold h-12 text-center">Preço Unitário (R$)</TableHead>
                  <TableHead className="font-bold h-12 text-right">Valor Total</TableHead>
                  <TableHead className="font-bold h-12 text-right w-[100px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-muted-foreground font-medium"
                    >
                      Nenhum item encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const qty = Number(item.current_quantity || 0)
                    const price = Number(item.unit_price || 0)
                    const total = qty * price
                    const isEditing = editingId === item.id

                    return (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-bold text-foreground text-[15px]">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-center font-black text-slate-700 dark:text-slate-300">
                          {qty}{' '}
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            {item.unit_type || 'UN'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              className="w-24 mx-auto text-center h-8 font-bold"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave(item.id)
                                if (e.key === 'Escape') setEditingId(null)
                              }}
                            />
                          ) : (
                            <span
                              className="font-bold cursor-pointer hover:text-primary transition-colors border-b border-dashed border-primary/30 pb-0.5"
                              onClick={() => {
                                setEditingId(item.id)
                                setEditValue(price.toString())
                              }}
                              title="Clique para editar"
                            >
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(price)}
                            </span>
                          )}
                          {price > 0 && !isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedHistoryItemId(item.id)
                                setActiveSubTab('historico_precos')
                              }}
                              className="ml-2 inline-flex items-center text-[10px] text-primary hover:underline font-bold"
                              title="Ver evolução e curva de preços deste insumo"
                            >
                              📈 Curva
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-black text-primary">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Button
                              size="sm"
                              onClick={() => handleSave(item.id)}
                              disabled={saving}
                              className="h-8"
                            >
                              {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-primary hover:bg-primary/10 h-8 font-bold"
                              onClick={() => {
                                setEditingId(item.id)
                                setEditValue(price.toString())
                              }}
                            >
                              Editar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="historico_precos" className="space-y-6 animate-fade-in">
          <PriceHistoryView
            history={priceHistory}
            items={items}
            loading={loadingHistory}
            initialSelectedItemId={selectedHistoryItemId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
