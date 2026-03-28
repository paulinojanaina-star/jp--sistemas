import { useState, useEffect } from 'react'
import { useTeamStore } from '@/stores/useTeamStore'
import { useToast } from '@/hooks/use-toast'
import { Employee, EmployeeCategory } from '@/types/team'
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
import { Loader2 } from 'lucide-react'

interface Props {
  employee?: Employee | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmployeeFormModal({ employee, open, onOpenChange }: Props) {
  const { saveEmployee } = useTeamStore()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [category, setCategory] = useState<EmployeeCategory | ''>('')
  const [birthDate, setBirthDate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(employee?.name || '')
      setCategory(employee?.category || '')
      setBirthDate(employee?.birth_date || '')
    }
  }, [open, employee])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !category) return

    setLoading(true)
    const { error } = await saveEmployee(employee?.id || null, {
      name: name.trim(),
      category: category as EmployeeCategory,
      birth_date: birthDate || null,
    })
    setLoading(false)

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Profissional salvo com sucesso.' })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employee ? 'Editar Profissional' : 'Novo Profissional'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Dr. João Silva"
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as EmployeeCategory)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEDICO">Médico</SelectItem>
                <SelectItem value="ENFERMEIRO">Enfermeiro</SelectItem>
                <SelectItem value="TECNICO">Técnico</SelectItem>
                <SelectItem value="AUXILIAR">Auxiliar</SelectItem>
                <SelectItem value="AGENTE">Agente</SelectItem>
                <SelectItem value="GERENTE">Gerente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data de Nascimento (Opcional)</Label>
            <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
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
