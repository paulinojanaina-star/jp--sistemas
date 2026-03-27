import { useState, useEffect } from 'react'
import { useTeamStore } from '@/stores/useTeamStore'
import { useToast } from '@/hooks/use-toast'
import { TimeOffRequest, TimeOffType } from '@/types/team'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface Props {
  request?: TimeOffRequest | null
  preselectedEmployeeId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TimeOffFormModal({ request, preselectedEmployeeId, open, onOpenChange }: Props) {
  const { employees, saveTimeOff } = useTeamStore()
  const { toast } = useToast()

  const [employeeId, setEmployeeId] = useState('')
  const [type, setType] = useState<TimeOffType | ''>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setEmployeeId(request?.employee_id || preselectedEmployeeId || '')
      setType(request?.type || '')
      setStartDate(request?.start_date || '')
      setEndDate(request?.end_date || '')
      setNotes(request?.notes || '')
    }
  }, [open, request, preselectedEmployeeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId || !type || !startDate || !endDate) return
    if (startDate > endDate) {
      toast({
        title: 'Data inválida',
        description: 'A data final deve ser maior ou igual à data inicial.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    const { error } = await saveTimeOff(request?.id || null, {
      employee_id: employeeId,
      type: type as TimeOffType,
      start_date: startDate,
      end_date: endDate,
      notes: notes.trim(),
    })
    setLoading(false)

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Registro salvo com sucesso.' })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{request ? 'Editar Ausência' : 'Registrar Ausência'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Profissional</Label>
            <Select
              value={employeeId}
              onValueChange={setEmployeeId}
              required
              disabled={!!preselectedEmployeeId && !request}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} - {emp.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de Ausência</Label>
            <Select value={type} onValueChange={(v) => setType(v as TimeOffType)} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FERIAS">Férias</SelectItem>
                <SelectItem value="FOLGA">Folga / Recesso</SelectItem>
                <SelectItem value="ATESTADO">Atestado Médico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Fim</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações (Opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo da ausência, detalhes do atestado..."
              rows={3}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
