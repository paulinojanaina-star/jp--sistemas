import { useState } from 'react'
import { useTeamStore } from '@/stores/useTeamStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Edit, Trash2, CalendarDays } from 'lucide-react'

interface Props {
  onEdit: (id: string) => void
  onViewTimeOffs: (id: string) => void
}

export function EmployeeList({ onEdit, onViewTimeOffs }: Props) {
  const { employees, deleteEmployee } = useTeamStore()
  const [search, setSearch] = useState('')

  const filtered = employees.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir?')) {
      await deleteEmployee(id)
    }
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Membros da Equipe</CardTitle>
            <CardDescription className="text-base mt-1">
              Gerencie os profissionais da unidade
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-9 h-10 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              className="p-4 rounded-xl border bg-card flex items-center justify-between transition-colors hover:border-border/80"
            >
              <div>
                <h4 className="font-medium text-base">{emp.name}</h4>
                <p className="text-xs text-muted-foreground uppercase mt-1">{emp.category}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewTimeOffs(emp.id)}
                  title="Ver Escalas"
                >
                  <CalendarDays className="h-4 w-4 text-primary" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onEdit(emp.id)} title="Editar">
                  <Edit className="h-4 w-4 text-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(emp.id)}
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground border rounded-xl border-dashed bg-background/50">
              Nenhum membro encontrado.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
