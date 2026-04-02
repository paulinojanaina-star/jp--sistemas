import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTeamStore } from '@/stores/useTeamStore'
import {
  CalendarIcon,
  Users,
  UserMinus,
  ArrowLeft,
  Clock,
  CalendarCheck,
  Percent,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'
import {
  format,
  addDays,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  subMonths,
  addMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TimeOffFormModal } from '@/components/team/TimeOffFormModal'

export default function Team() {
  const { employees, timeOffRequests, saveTimeOff } = useTeamStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [editingRequest, setEditingRequest] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const today = startOfDay(new Date())
  const nextWeekStart = addDays(today, 1)
  const nextWeekEnd = addDays(today, 7)

  const currentMonthStart = startOfMonth(currentDate)
  const currentMonthEnd = endOfMonth(currentDate)
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
      .map((req) => {
        const emp = employees.find((e) => e.id === req.employee_id)
        return { ...req, employeeName: emp?.name || 'Desconhecido', category: emp?.category || '' }
      })
  }

  const handleDragStart = (e: React.DragEvent, req: any) => {
    if (req.id.startsWith('auto-')) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('application/json', JSON.stringify(req))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    try {
      const data = e.dataTransfer.getData('application/json')
      if (!data) return
      const req = JSON.parse(data)

      const oldStart = startOfDay(new Date(req.start_date))
      const diffTime = targetDate.getTime() - oldStart.getTime()
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return

      const newStart = addDays(new Date(req.start_date), diffDays)
      const newEnd = addDays(new Date(req.end_date), diffDays)

      await saveTimeOff(req.id, {
        employee_id: req.employee_id,
        type: req.type,
        start_date: format(newStart, 'yyyy-MM-dd'),
        end_date: format(newEnd, 'yyyy-MM-dd'),
        notes: req.notes,
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleDayClick = (date: Date) => {
    setEditingRequest(null)
    setIsModalOpen(true)
  }

  const handleEditRequest = (e: React.MouseEvent, req: any) => {
    e.stopPropagation()
    if (req.id.startsWith('auto-')) return
    setEditingRequest(req)
    setIsModalOpen(true)
  }

  const totalEmployees = employees.length
  const absencesToday = getAbsencesForDay(today).length
  const availableToday = totalEmployees - absencesToday
  const occupancyRate = totalEmployees > 0 ? Math.round((availableToday / totalEmployees) * 100) : 0

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

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total de Colaboradores</p>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Registrados no sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Disponíveis Hoje</p>
              <CalendarCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black">{availableToday}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {absencesToday > 0 ? `${absencesToday} ausências hoje` : 'Equipe 100% completa'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-indigo-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Taxa de Ocupação</p>
              <Percent className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black">{occupancyRate}%</div>
            <div className="w-full bg-secondary h-2 mt-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'bg-white dark:bg-slate-900 border-l-4 shadow-sm',
            upcomingAbsences.length > 0 ? 'border-l-orange-500' : 'border-l-slate-300',
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Alertas da Semana</p>
              <AlertTriangle
                className={cn(
                  'h-4 w-4',
                  upcomingAbsences.length > 0 ? 'text-orange-500' : 'text-slate-400',
                )}
              />
            </div>
            <div className="text-2xl font-black">{upcomingAbsences.length}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Ausências nos próximos 7 dias
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 grid-cols-1 xl:grid-cols-4">
        <div className="xl:col-span-3 space-y-6">
          <Card className="shadow-lg border-border/50 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 border-b border-border/50 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                  Calendário de Escalas Interativo
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    className="h-9 w-9 rounded-full shadow-sm hover:shadow-md transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-bold bg-primary/10 text-primary px-5 py-2 rounded-full capitalize min-w-[160px] text-center shadow-inner">
                    {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    className="h-9 w-9 rounded-full shadow-sm hover:shadow-md transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full grid grid-cols-7 border-b border-border/50 bg-slate-50/80 dark:bg-slate-900/40">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div
                    key={day}
                    className="py-3 text-center text-sm font-bold text-muted-foreground border-r border-border/50 last:border-0 uppercase tracking-wider"
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
                  const isTodayDate = isSameDay(day, today)

                  return (
                    <div
                      key={day.toString()}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day)}
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        'border-r border-b border-border/50 p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/20 group relative cursor-pointer flex flex-col',
                        isTodayDate && 'bg-blue-50/30 dark:bg-blue-900/10',
                      )}
                    >
                      <div className="flex justify-between items-start mb-2 shrink-0">
                        <span
                          className={cn(
                            'text-sm font-bold h-7 w-7 flex items-center justify-center rounded-full transition-all',
                            isTodayDate
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'text-foreground group-hover:text-primary',
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                        <div className="flex gap-1 items-center">
                          {dayAbsences.length > 0 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 h-5 font-bold bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30"
                            >
                              {dayAbsences.length}
                            </Badge>
                          )}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-full">
                            <Plus className="h-3 w-3 text-muted-foreground hover:text-primary" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 overflow-y-auto flex-1 scrollbar-hide">
                        {dayAbsences.map(
                          (req, j) =>
                            req && (
                              <div
                                key={`${req.id}-${j}`}
                                draggable={!req.id.startsWith('auto-')}
                                onDragStart={(e) => handleDragStart(e, req)}
                                onClick={(e) => handleEditRequest(e, req)}
                                className={cn(
                                  'text-[11px] leading-tight px-1.5 py-1 rounded font-semibold border truncate transition-all',
                                  req.id.startsWith('auto-')
                                    ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200 cursor-default dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                                    : 'bg-blue-100/80 text-blue-700 border-blue-200 cursor-grab hover:shadow-sm hover:brightness-95 active:cursor-grabbing dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
                                )}
                                title={`${req.employeeName} - ${req.type}`}
                              >
                                {req.employeeName.split(' ')[0]} ({req.category.substring(0, 3)})
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
          <Card className="shadow-lg border-orange-200 dark:border-orange-500/30 bg-gradient-to-b from-orange-50/80 to-white dark:from-orange-500/10 dark:to-slate-950 rounded-2xl overflow-hidden h-fit">
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
        </div>
      </div>
      <TimeOffFormModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) setEditingRequest(null)
        }}
        request={editingRequest}
      />
    </div>
  )
}
