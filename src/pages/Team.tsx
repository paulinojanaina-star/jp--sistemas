import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, Users, CalendarPlus, ShieldAlert } from 'lucide-react'
import { TeamDashboard } from '@/components/team/TeamDashboard'
import { EmployeeList } from '@/components/team/EmployeeList'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { TimeOffFormModal } from '@/components/team/TimeOffFormModal'

export default function Team() {
  const [timeOffModalOpen, setTimeOffModalOpen] = useState(false)

  return (
    <div className="space-y-8 animate-fade-in-up pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-gradient-to-r from-card to-muted/20 p-8 rounded-3xl border border-border/50 shadow-sm">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-extrabold uppercase tracking-widest mb-1">
            <ShieldAlert className="h-3.5 w-3.5" />
            Human Resources
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            Equipe & Escalas
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl leading-relaxed font-medium">
            Gestão inteligente de profissionais, registro de ausências e monitoramento contínuo de
            disponibilidade.
          </p>
        </div>
        <Button
          onClick={() => setTimeOffModalOpen(true)}
          size="lg"
          className="rounded-xl shadow-md hover:shadow-lg transition-all font-bold gap-2"
        >
          <CalendarPlus className="h-5 w-5" />
          Registrar Ausência
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <div className="bg-card rounded-2xl p-1.5 border border-border/50 shadow-sm inline-flex">
          <TabsList className="grid w-[320px] grid-cols-2 h-auto bg-transparent gap-1">
            <TabsTrigger
              value="dashboard"
              className="gap-2 text-sm py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all font-bold"
            >
              <CalendarDays className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="employees"
              className="gap-2 text-sm py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all font-bold"
            >
              <Users className="h-4 w-4" />
              Profissionais
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="bg-card border border-border/50 shadow-subtle rounded-3xl p-6 lg:p-8 min-h-[400px]">
          <TabsContent
            value="dashboard"
            className="mt-0 outline-none animate-in fade-in-50 duration-500"
          >
            <TeamDashboard />
          </TabsContent>

          <TabsContent
            value="employees"
            className="mt-0 outline-none animate-in fade-in-50 duration-500"
          >
            <EmployeeList />
          </TabsContent>
        </div>
      </Tabs>

      {timeOffModalOpen && (
        <TimeOffFormModal open={timeOffModalOpen} onOpenChange={setTimeOffModalOpen} />
      )}
    </div>
  )
}
