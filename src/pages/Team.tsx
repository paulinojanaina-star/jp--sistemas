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
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-[2rem] border border-border/50 shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 min-h-[240px] p-8 lg:p-12">
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

        <div className="relative z-10 flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-black uppercase tracking-widest w-fit backdrop-blur-md shadow-inner">
            <ShieldAlert className="h-4 w-4" strokeWidth={2.5} />
            Capital Humano Corporativo
          </div>
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-white drop-shadow-lg">
            Equipe & Escalas
          </h1>
          <p className="text-lg lg:text-xl text-slate-300 max-w-2xl font-bold drop-shadow-md">
            Gestão executiva de profissionais, registro integrado de ausências e monitoramento
            contínuo de capacidade.
          </p>
        </div>

        <div className="relative z-10">
          <Button
            onClick={() => setTimeOffModalOpen(true)}
            size="lg"
            className="rounded-[1.5rem] h-14 px-8 shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all duration-300 font-extrabold gap-3 text-base bg-primary text-primary-foreground border border-primary/50 hover:bg-primary/90"
          >
            <CalendarPlus className="h-6 w-6" strokeWidth={2.5} />
            Registrar Ausência
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-8">
        <div className="bg-card/80 backdrop-blur-xl rounded-[1.5rem] p-2 border border-border/50 shadow-lg inline-flex w-full md:w-auto">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2 h-auto bg-transparent gap-2">
            <TabsTrigger
              value="dashboard"
              className="gap-2 text-sm py-3.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all font-extrabold"
            >
              <CalendarDays className="h-5 w-5" />
              Visão Executiva
            </TabsTrigger>
            <TabsTrigger
              value="employees"
              className="gap-2 text-sm py-3.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all font-extrabold"
            >
              <Users className="h-5 w-5" />
              Corpo Clínico
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="bg-card/90 backdrop-blur-2xl border border-border/50 shadow-2xl rounded-[2rem] p-6 lg:p-10 min-h-[500px]">
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
