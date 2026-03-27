import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, Users, CalendarPlus } from 'lucide-react'
import { TeamDashboard } from '@/components/team/TeamDashboard'
import { EmployeeList } from '@/components/team/EmployeeList'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { TimeOffFormModal } from '@/components/team/TimeOffFormModal'

export default function Team() {
  const [timeOffModalOpen, setTimeOffModalOpen] = useState(false)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Equipe & Escalas</h2>
          <p className="text-muted-foreground">
            Gerencie o cadastro de profissionais, registre férias e acompanhe as folgas da sua
            equipe.
          </p>
        </div>
        <Button onClick={() => setTimeOffModalOpen(true)} className="gap-2">
          <CalendarPlus className="h-4 w-4" />
          Registrar Férias / Folga
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="dashboard" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="employees" className="gap-2">
            <Users className="h-4 w-4" />
            Profissionais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <TeamDashboard />
        </TabsContent>

        <TabsContent value="employees" className="space-y-4 outline-none">
          <EmployeeList />
        </TabsContent>
      </Tabs>

      {timeOffModalOpen && (
        <TimeOffFormModal open={timeOffModalOpen} onOpenChange={setTimeOffModalOpen} />
      )}
    </div>
  )
}
