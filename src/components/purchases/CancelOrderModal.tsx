import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { PurchaseOrder } from '@/types/purchaseOrder'
import { formatItemDisplay } from '@/utils/itemFormat'
import { Ban, Loader2 } from 'lucide-react'

interface CancelOrderModalProps {
  order: PurchaseOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (orderId: string, justification: string) => Promise<boolean>
}

export function CancelOrderModal({ order, open, onOpenChange, onConfirm }: CancelOrderModalProps) {
  const [justification, setJustification] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!order) return null

  const handleConfirm = async () => {
    if (!justification.trim()) {
      setError('A justificativa do cancelamento é obrigatória.')
      return
    }
    setError('')
    setSubmitting(true)
    const success = await onConfirm(order.id, justification.trim())
    setSubmitting(false)
    if (success) {
      setJustification('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
              <Ban className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black">Cancelar Pedido de Compra</DialogTitle>
              <DialogDescription className="text-xs">
                Esta ação marcará o pedido como cancelado e registrará a justificativa.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-lg border bg-muted/40 text-sm space-y-1">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase">
                Solicitação:
              </span>{' '}
              <span className="font-mono font-bold">{order.request_number}</span>
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase">Item:</span>{' '}
              <span className="font-medium">
                {order.item ? formatItemDisplay(order.item) : 'Item selecionado'}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase">
                Saldo Pendente:
              </span>{' '}
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {order.quantity_ordered - order.quantity_received} {order.item?.unit_type || 'un'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cancel-justification" className="text-xs font-bold">
              Justificativa do Cancelamento <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cancel-justification"
              placeholder="Ex: Fornecedor sem previsão de entrega / Cotação cancelada pelo setor..."
              value={justification}
              onChange={(e) => {
                setJustification(e.target.value)
                if (error) setError('')
              }}
              className="resize-none h-24 text-sm"
            />
            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Voltar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={submitting || !justification.trim()}
            className="font-bold"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Confirmar Cancelamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
