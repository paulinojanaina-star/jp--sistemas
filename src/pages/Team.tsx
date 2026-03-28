import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, Users, CalendarPlus, ShieldAlert, LayoutDashboard } from 'lucide-react'
import { TeamDashboard } from '@/components/team/TeamDashboard'
import { TeamCalendar } from '@/components/team/TeamCalendar'
import { EmployeeList } from '@/components/team/EmployeeList'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { TimeOffFormModal } from '@/components/team/TimeOffFormModal'

export default function Team() {
  const [timeOffModalOpen, setTimeOffModalOpen] = useState(false)

  return (
    <div className="space-y-8 animate-fade-in-up pb-8">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 shadow-lg mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 min-h-[160px] p-6 lg:p-8">
        <div
          className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity"
          style={{
            backgroundImage:
              'url("https://img.usecurling.com/p/1920/600?q=medical%20professionals%20team%20hospital&color=blue&dpr=2")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/40 z-0" />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold uppercase tracking-wider w-fit backdrop-blur-md shadow-inner">
            <ShieldAlert className="h-3.5 w-3.5" strokeWidth={2.5} />
            Capital Humano Corporativo
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-md">
            Profissionais & Escalas
          </h1>
          <p className="text-base text-slate-300 max-w-2xl font-medium drop-shadow-sm">
            Gestão executiva de profissionais, registro integrado de ausências e monitoramento
            contínuo de capacidade.
          </p>
        </div>

        <div className="relative z-10">
          <Button
            onClick={() => setTimeOffModalOpen(true)}
            size="lg"
            className="rounded-xl h-12 px-6 shadow-md hover:shadow-lg transition-all duration-300 font-bold gap-2 text-sm bg-primary text-primary-foreground border border-primary/50 hover:bg-primary/90"
          >
            <CalendarPlus className="h-5 w-5" strokeWidth={2.5} />
            Registrar Ausência
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <div className="bg-card/80 backdrop-blur-xl rounded-xl p-1.5 border border-border/50 shadow-sm inline-flex w-full overflow-x-auto">
          <TabsList className="flex w-max min-w-full md:w-auto md:grid md:grid-cols-3 h-auto bg-transparent gap-1.5 p-0">
            <TabsTrigger
              value="dashboard"
              className="gap-2 text-sm py-2 px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all font-semibold flex-1"
            >
              <LayoutDashboard className="h-4 w-4" />
              Visão Executiva
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="gap-2 text-sm py-2 px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all font-semibold flex-1"
            >
              <CalendarDays className="h-4 w-4" />
              Calendário
            </TabsTrigger>
            <TabsTrigger
              value="employees"
              className="gap-2 text-sm py-2 px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all font-semibold flex-1"
            >
              <Users className="h-4 w-4" />
              Corpo Clínico
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="bg-card/90 backdrop-blur-2xl border border-border/50 shadow-lg rounded-2xl p-4 sm:p-6 min-h-[400px]">
          <TabsContent
            value="dashboard"
            className="mt-0 outline-none animate-in fade-in-50 duration-500"
          >
            <TeamDashboard />
          </TabsContent>

          <TabsContent
            value="calendar"
            className="mt-0 outline-none animate-in fade-in-50 duration-500"
          >
            <TeamCalendar />
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
