import { useState } from 'react'
import { useTeamStore } from '@/stores/useTeamStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Edit2, Trash2, CalendarPlus, CalendarDays } from 'lucide-react'
import { Employee } from '@/types/team'
import { EmployeeFormModal } from './EmployeeFormModal'
import { TimeOffFormModal } from './TimeOffFormModal'
import { EmployeeTimeOffsModal } from './EmployeeTimeOffsModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function EmployeeList() {
  const { employees, deleteEmployee } = useTeamStore()

  const [employeeModalOpen, setEmployeeModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  const [timeOffModalOpen, setTimeOffModalOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)

  const [timeOffsListOpen, setTimeOffsListOpen] = useState(false)
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null)

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp)
    setEmployeeModalOpen(true)
  }

  const handleAddAbsence = (empId: string) => {
    setSelectedEmployeeId(empId)
    setTimeOffModalOpen(true)
  }

  const handleViewAbsences = (emp: Employee) => {
    setViewingEmployee(emp)
    setTimeOffsListOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        'Tem certeza que deseja excluir este profissional? O histórico de ausências dele também será apagado.',
      )
    ) {
      await deleteEmployee(id)
    }
  }

  const categoryColors: Record<string, string> = {
    MEDICO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    ENFERMEIRO: 'bg-blue-100 text-blue-800 border-blue-200',
    TECNICO: 'bg-purple-100 text-purple-800 border-purple-200',
    AUXILIAR: 'bg-orange-100 text-orange-800 border-orange-200',
    AGENTE: 'bg-teal-100 text-teal-800 border-teal-200',
  }

  const filteredEmployees = employees.filter(
    (emp) => selectedCategory === 'ALL' || emp.category === selectedCategory,
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-base font-semibold">Gestão da Equipe</h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px] h-9">
              <SelectValue placeholder="Todas as Categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as Categorias</SelectItem>
              <SelectItem value="MEDICO">Médico</SelectItem>
              <SelectItem value="ENFERMEIRO">Enfermeiro</SelectItem>
              <SelectItem value="TECNICO">Técnico</SelectItem>
              <SelectItem value="AUXILIAR">Auxiliar</SelectItem>
              <SelectItem value="AGENTE">Agente</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => {
              setEditingEmployee(null)
              setEmployeeModalOpen(true)
            }}
            className="gap-1.5 shrink-0 h-9"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="py-3">Nome</TableHead>
                <TableHead className="py-3">Categoria</TableHead>
                <TableHead className="text-right py-3">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    {employees.length === 0
                      ? 'Nenhum profissional cadastrado.'
                      : 'Nenhum profissional encontrado para esta categoria.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium py-2.5">{emp.name}</TableCell>
                    <TableCell className="py-2.5">
                      <Badge
                        variant="outline"
                        className={`${categoryColors[emp.category] || ''} text-[10px] px-2 py-0`}
                      >
                        {emp.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAbsences(emp)}
                          title="Ver Ausências Programadas"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <CalendarDays className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddAbsence(emp.id)}
                          title="Registrar Ausência"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <CalendarPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(emp)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(emp.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EmployeeFormModal
        employee={editingEmployee}
        open={employeeModalOpen}
        onOpenChange={setEmployeeModalOpen}
      />

      {timeOffModalOpen && (
        <TimeOffFormModal
          preselectedEmployeeId={selectedEmployeeId}
          open={timeOffModalOpen}
          onOpenChange={(open) => {
            setTimeOffModalOpen(open)
            if (!open) setSelectedEmployeeId(null)
          }}
        />
      )}

      {timeOffsListOpen && (
        <EmployeeTimeOffsModal
          employee={viewingEmployee}
          open={timeOffsListOpen}
          onOpenChange={(open) => {
            setTimeOffsListOpen(open)
            if (!open) setViewingEmployee(null)
          }}
        />
      )}
    </div>
  )
}
