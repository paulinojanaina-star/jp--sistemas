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
import { useToast } from '@/hooks/use-toast'

interface Props {
  id: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmployeeFormModal({ id, open, onOpenChange }: Props) {
  const { employees, saveEmployee } = useTeamStore()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id && id !== 'new') {
      const emp = employees.find((e) => e.id === id)
      if (emp) {
        setName(emp.name)
        setCategory(emp.category)
        setBirthDate(emp.birth_date || '')
      }
    } else {
      setName('')
      setCategory('')
      setBirthDate('')
    }
  }, [id, open, employees])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await saveEmployee(id === 'new' ? null : id, {
      name,
      category: category as any,
      birth_date: birthDate || null,
    })
    setLoading(false)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Profissional salvo com sucesso.' })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{id === 'new' ? 'Novo Membro da Equipe' : 'Editar Membro'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: João da Silva"
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria Profissional</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEDICO">Médico</SelectItem>
                <SelectItem value="ENFERMEIRO">Enfermeiro</SelectItem>
                <SelectItem value="TECNICO">Técnico em Enfermagem</SelectItem>
                <SelectItem value="AUXILIAR">Auxiliar de Enfermagem</SelectItem>
                <SelectItem value="AGENTE">Agente Comunitário</SelectItem>
                <SelectItem value="GERENTE">Gerente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data de Nascimento (Opcional)</Label>
            <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">
              O sistema criará automaticamente ausências para aniversariantes.
            </p>
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
