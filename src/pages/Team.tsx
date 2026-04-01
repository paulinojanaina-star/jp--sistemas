import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTeamStore } from '@/stores/useTeamStore'
import { CalendarIcon, Users, UserMinus, ArrowLeft, Clock } from 'lucide-react'
import {
  format,
  addDays,
  isWithinInterval,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function Team() {
  const { employees, timeOffRequests } = useTeamStore()
  const today = startOfDay(new Date())
  const nextWeekStart = addDays(today, 1)
  const nextWeekEnd = addDays(today, 7)

  const currentMonthStart = startOfMonth(today)
  const currentMonthEnd = endOfMonth(today)
  const calendarDays = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd })

  const upcomingAbsences = useMemo(() => {
    return timeOffRequests
      .filter((req) => {
        const reqStart = startOfDay(new Date(req.start_date))
        const reqEnd = endOfDay(new Date(req.end_date))
        return reqStart <= nextWeekEnd && reqEnd >= nextWeekStart
      })
      .map((req) => {
        const emp = employees.find((e) => e.id === req.employee_id)
        return {
          ...req,
          employeeName: emp?.name || 'Colaborador Desconhecido',
          category: emp?.category || '',
        }
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
  }, [timeOffRequests, employees, nextWeekStart, nextWeekEnd])

  const getAbsencesForDay = (date: Date) => {
    return timeOffRequests
      .filter((req) => {
        const reqStart = startOfDay(new Date(req.start_date))
        const reqEnd = endOfDay(new Date(req.end_date))
        return date >= reqStart && date <= reqEnd
      })
      .map((req) => employees.find((e) => e.id === req.employee_id))
  }

  return (
    <div className="space-y-8 animate-fade-in-up pb-8 p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-4 pb-6 border-b border-border/40">
        <Button
          variant="outline"
          size="icon"
          asChild
          className="rounded-full h-11 w-11 bg-background shadow-sm hover:shadow-md transition-all"
        >
          <Link to="/">
            <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
          </Link>
        </Button>
        <div>
          <h3 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            Capital Humano
          </h3>
          <p className="text-sm font-bold text-muted-foreground mt-1 tracking-wide">
            Gestão inteligente de escalas e ausências corporativas
          </p>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 xl:grid-cols-4">
        <div className="xl:col-span-3 space-y-6">
          <Card className="shadow-lg border-border/50 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                  Calendário de Escalas
                </CardTitle>
                <div className="text-sm font-bold bg-primary/10 text-primary px-4 py-1.5 rounded-full capitalize">
                  {format(today, "MMMM 'de' yyyy", { locale: ptBR })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full grid grid-cols-7 border-b border-border/50 bg-slate-50/80 dark:bg-slate-900/40">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div
                    key={day}
                    className="py-3 text-center text-sm font-bold text-muted-foreground border-r border-border/50 last:border-0"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 w-full auto-rows-[minmax(120px,auto)] bg-card">
                {Array.from({ length: currentMonthStart.getDay() }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="border-r border-b border-border/50 bg-slate-50/30 dark:bg-slate-900/10"
                  />
                ))}

                {calendarDays.map((day, idx) => {
                  const dayAbsences = getAbsencesForDay(day)
                  const isToday = isSameDay(day, today)

                  return (
                    <div
                      key={day.toString()}
                      className={cn(
                        'border-r border-b border-border/50 p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/20 group relative',
                        isToday && 'bg-blue-50/30 dark:bg-blue-900/10',
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={cn(
                            'text-sm font-bold h-7 w-7 flex items-center justify-center rounded-full transition-all',
                            isToday
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-foreground group-hover:text-primary',
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                        {dayAbsences.length > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 h-5 font-bold bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30"
                          >
                            {dayAbsences.length} aus.
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1.5 overflow-y-auto max-h-[80px] scrollbar-hide">
                        {dayAbsences.map(
                          (emp, j) =>
                            emp && (
                              <div
                                key={`${emp.id}-${j}`}
                                className="text-[11px] leading-tight px-1.5 py-1 rounded bg-orange-100/80 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 font-semibold border border-orange-200 dark:border-orange-500/30 truncate"
                                title={emp.name}
                              >
                                {emp.name.split(' ')[0]} ({emp.category.substring(0, 3)})
                              </div>
                            ),
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg border-orange-200 dark:border-orange-500/30 bg-gradient-to-b from-orange-50/80 to-white dark:from-orange-500/10 dark:to-slate-950 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-orange-100 dark:border-orange-500/20 bg-orange-100/50 dark:bg-orange-500/10">
              <CardTitle className="flex items-center gap-2 text-lg font-black text-orange-700 dark:text-orange-400">
                <Clock className="h-5 w-5" />
                Ausências Próxima Sem.
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4 pb-4">
              {upcomingAbsences.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                  <UserMinus className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="font-bold">Nenhuma ausência prevista</p>
                  <p className="text-sm mt-1">Equipe completa para os próximos 7 dias.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAbsences.map((absence) => (
                    <div
                      key={absence.id}
                      className="flex items-start justify-between bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-orange-100 dark:border-orange-500/20 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-sm text-foreground truncate">
                          {absence.employeeName}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                          {absence.category}
                        </p>
                        <p className="text-xs font-bold mt-1.5 text-orange-600 dark:text-orange-400 flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(absence.start_date), 'dd/MM')} -{' '}
                          {format(new Date(absence.end_date), 'dd/MM')}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider shrink-0',
                          absence.type === 'FERIAS'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                            : absence.type === 'ATESTADO'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                        )}
                      >
                        {absence.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md rounded-2xl border-border/50">
            <CardHeader className="pb-3 bg-slate-50/50 dark:bg-slate-900/20 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Users className="h-5 w-5 text-blue-500" />
                Resumo da Equipe
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex justify-between items-center py-3 border-b border-border/50 last:border-0">
                <span className="text-sm font-bold text-muted-foreground">
                  Total de Colaboradores
                </span>
                <span className="font-black text-xl">{employees.length}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/50 last:border-0">
                <span className="text-sm font-bold text-muted-foreground">Ausências Hoje</span>
                <span className="font-black text-xl text-orange-500">
                  {
                    timeOffRequests.filter((req) => {
                      const reqStart = startOfDay(new Date(req.start_date))
                      const reqEnd = endOfDay(new Date(req.end_date))
                      return reqStart <= today && reqEnd >= today
                    }).length
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
