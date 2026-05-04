import { useState, useMemo } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, DollarSign, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function FinancialTab() {
  const { items, updateItem } = useInventoryStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

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
    setSaving(false)

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o preço.',
        variant: 'destructive',
      })
      return
    }

    setEditingId(null)
    toast({ title: 'Sucesso', description: 'Preço unitário atualizado.' })
  }

  return (
    <div className="space-y-4">
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
          <div className="relative w-full ml-auto md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar item..."
              className="pl-9 rounded-xl bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
    </div>
  )
}
