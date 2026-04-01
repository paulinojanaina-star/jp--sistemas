import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmployeeList } from '@/components/team/EmployeeList'
import { TimeOffList } from '@/components/team/TimeOffList'
import { EmployeeFormModal } from '@/components/team/EmployeeFormModal'
import { TimeOffFormModal } from '@/components/team/TimeOffFormModal'
import { EmployeeTimeOffsModal } from '@/components/team/EmployeeTimeOffsModal'
import { useTeamStore } from '@/stores/useTeamStore'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function Team() {
  const { employees } = useTeamStore()
  const [activeTab, setActiveTab] = useState('escalas')
  const [editEmployeeId, setEditEmployeeId] = useState<string | null>(null)
  const [editTimeOffId, setEditTimeOffId] = useState<string | null>(null)
  const [viewTimeOffsEmpId, setViewTimeOffsEmpId] = useState<string | null>(null)

  const viewEmployee = employees.find((e) => e.id === viewTimeOffsEmpId) || null

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Equipe e Escalas</h1>
          <p className="text-muted-foreground">
            Gerencie os profissionais da unidade e acompanhe as escalas programadas.
          </p>
        </div>
        <div>
          {activeTab === 'escalas' ? (
            <Button onClick={() => setEditTimeOffId('new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Escala
            </Button>
          ) : (
            <Button onClick={() => setEditEmployeeId('new')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Membro
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="escalas">Escalas Programadas</TabsTrigger>
          <TabsTrigger value="membros">Membros da Equipe</TabsTrigger>
        </TabsList>
        <TabsContent value="escalas" className="mt-8">
          <TimeOffList onEdit={setEditTimeOffId} />
        </TabsContent>
        <TabsContent value="membros" className="mt-8">
          <EmployeeList onEdit={setEditEmployeeId} onViewTimeOffs={setViewTimeOffsEmpId} />
        </TabsContent>
      </Tabs>

      <EmployeeFormModal
        id={editEmployeeId}
        open={!!editEmployeeId}
        onOpenChange={(open) => !open && setEditEmployeeId(null)}
      />

      <TimeOffFormModal
        id={editTimeOffId}
        open={!!editTimeOffId}
        onOpenChange={(open) => !open && setEditTimeOffId(null)}
      />

      <EmployeeTimeOffsModal
        employee={viewEmployee}
        open={!!viewTimeOffsEmpId}
        onOpenChange={(open) => !open && setViewTimeOffsEmpId(null)}
      />
    </div>
  )
}
