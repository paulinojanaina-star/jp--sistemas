import { useEffect, useState } from 'react'
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
import { useTeamStore } from '@/stores/useTeamStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export function EmployeeFormModal({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: any | null
}) {
  const { saveEmployee } = useTeamStore()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (employee && open) {
      setName(employee.name || '')
      setCategory(employee.category || '')
      setBirthDate(employee.birth_date || '')
    } else if (open) {
      setName('')
      setCategory('')
      setBirthDate('')
    }
  }, [employee, open])

  const handleSave = async () => {
    if (!name || !category) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o nome e a categoria.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      if (saveEmployee) {
        await saveEmployee(employee?.id, { name, category, birth_date: birthDate || null })
      }
      toast({
        title: 'Sucesso',
        description: employee ? 'Profissional atualizado.' : 'Profissional cadastrado.',
      })
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar profissional.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{employee ? 'Editar Profissional' : 'Novo Profissional'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do profissional"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Categoria / Cargo</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cargo" />
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
          <div className="grid gap-2">
            <Label htmlFor="birthDate">Data de Nascimento (Opcional)</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
