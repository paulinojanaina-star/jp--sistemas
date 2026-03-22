import { useState } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Merge, ArrowRight, Check, ChevronsUpDown, AlertTriangle } from 'lucide-react'
import { Item } from '@/types/inventory'
import { formatItemDisplay } from '@/utils/itemFormat'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface MergeItemModalProps {
  item: Item
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MergeItemModal({ item, open, onOpenChange }: MergeItemModalProps) {
  const { items, mergeItems } = useInventoryStore()
  const { toast } = useToast()
  const [destinationId, setDestinationId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)

  const otherItems = items.filter((i) => i.id !== item.id)

  const onMerge = async () => {
    if (!destinationId) {
      toast({
        title: 'Atenção',
        description: 'Selecione um item de destino.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    const { error } = await mergeItems(item.id, destinationId)
    setLoading(false)

    if (error) {
      toast({
        title: 'Erro no Merge',
        description: error.message || 'Não foi possível mesclar os itens.',
        variant: 'destructive',
      })
      return
    }

    toast({ title: 'Sucesso!', description: 'Histórico transferido e item original arquivado.' })
    setDestinationId('')
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) setDestinationId('')
        onOpenChange(val)
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5 text-primary" /> Merge Inteligente
          </DialogTitle>
          <DialogDescription>
            Transfira todo o histórico e saldo de <strong>{formatItemDisplay(item)}</strong> para
            outro item. O item original será excluído.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Item de Origem (Será removido)</label>
            <div className="p-3 bg-muted rounded-md text-sm border text-muted-foreground flex items-center justify-between">
              <span>{formatItemDisplay(item)}</span>
              <span className="font-mono">{item.current_quantity} em estoque</span>
            </div>
          </div>

          <div className="flex justify-center text-muted-foreground">
            <ArrowRight className="h-5 w-5 rotate-90 sm:rotate-0" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Item de Destino (Receberá os dados)</label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between"
                >
                  {destinationId
                    ? formatItemDisplay(items.find((i) => i.id === destinationId))
                    : 'Selecione o item de destino...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar item..." />
                  <CommandList>
                    <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                    <CommandGroup>
                      {otherItems.map((i) => (
                        <CommandItem
                          key={i.id}
                          value={formatItemDisplay(i)}
                          onSelect={() => {
                            setDestinationId(i.id)
                            setOpenCombobox(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4 shrink-0',
                              destinationId === i.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <div className="flex flex-col overflow-hidden">
                            <span className="truncate">{formatItemDisplay(i)}</span>
                            <span className="text-xs text-muted-foreground">
                              Saldo atual: {i.current_quantity}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <Alert
            variant="destructive"
            className="bg-destructive/10 border-destructive/20 text-destructive mt-4"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Atenção: Esta ação é irreversível. O estoque atual do item de origem será somado ao
              item de destino e o histórico será unificado.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={onMerge} disabled={!destinationId || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
