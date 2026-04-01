import { useState, useEffect } from 'react'
import { useTeamStore } from '@/stores/useTeamStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { useToast } from '@/hooks/use-toast'

interface Props {
  id: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TimeOffFormModal({ id, open, onOpenChange }: Props) {
  const { employees, timeOffRequests, saveTimeOff } = useTeamStore()
  const { toast } = useToast()
  const [employeeId, setEmployeeId] = useState('')
  const [type, setType] = useState('FERIAS')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id && id !== 'new') {
      const req = timeOffRequests.find((r) => r.id === id)
      if (req) {
        setEmployeeId(req.employee_id)
        setType(req.type)
        setStartDate(req.start_date)
        setEndDate(req.end_date)
        setNotes(req.notes || '')
      }
    } else {
      setEmployeeId('')
      setType('FERIAS')
      setStartDate('')
      setEndDate('')
      setNotes('')
    }
  }, [id, open, timeOffRequests])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await saveTimeOff(id === 'new' ? null : id, {
      employee_id: employeeId,
      type: type as any,
      start_date: startDate,
      end_date: endDate,
      notes,
    })
    setLoading(false)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Escala salva com sucesso.' })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{id === 'new' ? 'Nova Escala Programada' : 'Editar Escala'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Profissional</Label>
            <Select value={employeeId} onValueChange={setEmployeeId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o membro..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de Ausência</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FERIAS">Férias</SelectItem>
                <SelectItem value="FOLGA">Folga</SelectItem>
                <SelectItem value="ATESTADO">Atestado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
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
              placeholder="Ex: ESAV DENGUE"
              className="resize-none h-20"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
