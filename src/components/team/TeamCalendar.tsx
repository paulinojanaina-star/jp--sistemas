import { useState } from 'react'
import { useTeamStore } from '@/stores/useTeamStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export function TeamCalendar() {
  const { timeOffRequests } = useTeamStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const isDateInRange = (date: Date, startStr: string, endStr: string) => {
    const dStr = format(date, 'yyyy-MM-dd')
    return dStr >= startStr && dStr <= endStr
  }

  const selectedDateRequests = selectedDate
    ? timeOffRequests.filter((req) => isDateInRange(selectedDate, req.start_date, req.end_date))
    : []

  const getBadgeStyle = (type: string) => {
    if (type === 'FERIAS') return 'bg-amber-500/10 text-amber-600 border-amber-200'
    if (type === 'ATESTADO') return 'bg-rose-500/10 text-rose-600 border-rose-200'
    if (type === 'ANIVERSARIO') return 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-200'
    if (type === 'FERIADO') return 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
    return 'bg-blue-500/10 text-blue-600 border-blue-200'
  }

  const getTypeColor = (type: string) => {
    if (type === 'FERIAS') return 'bg-amber-500'
    if (type === 'ATESTADO') return 'bg-rose-500'
    if (type === 'ANIVERSARIO') return 'bg-fuchsia-500'
    if (type === 'FERIADO') return 'bg-emerald-500'
    return 'bg-blue-500'
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start">
      <Card className="flex-1 shadow-md border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between pb-3 border-b">
          <CardTitle className="text-lg font-bold flex items-center gap-2 mb-3 sm:mb-0">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Calendário de Escalas
          </CardTitle>
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-full border border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-8 w-8 p-0 hover:bg-background shadow-sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-bold capitalize w-28 sm:w-32 text-center tracking-tight">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-8 w-8 p-0 hover:bg-background shadow-sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <div
                key={d}
                className="font-bold text-xs sm:text-sm text-muted-foreground/80 py-2 uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {days.map((day) => {
              const requests = timeOffRequests.filter((req) =>
                isDateInRange(day, req.start_date, req.end_date),
              )
              const isSelected =
                selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isTodayDate = isToday(day)

              const systemOffRequest = requests.find(
                (req) => req.type === 'FERIADO' || req.type === 'PONTO_FACULTATIVO',
              )
              const isSystemOff = !!systemOffRequest
              const isHoliday = systemOffRequest?.type === 'FERIADO'
              const isOptional = systemOffRequest?.type === 'PONTO_FACULTATIVO'

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'min-h-[60px] sm:min-h-[80px] p-1 sm:p-1.5 border rounded-xl cursor-pointer transition-all flex flex-col items-start gap-1 group relative overflow-hidden',
                    !isCurrentMonth && 'opacity-40 bg-muted/30',
                    isHoliday
                      ? isSelected
                        ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-md bg-emerald-500/20 scale-[1.02]'
                        : 'border-emerald-200 bg-emerald-500/10 hover:border-emerald-300 hover:bg-emerald-500/20'
                      : isOptional
                        ? isSelected
                          ? 'ring-2 ring-violet-500 border-violet-500 shadow-md bg-violet-500/20 scale-[1.02]'
                          : 'border-violet-200 bg-violet-500/10 hover:border-violet-300 hover:bg-violet-500/20'
                        : isSelected
                          ? 'ring-2 ring-primary border-primary shadow-md bg-primary/5 scale-[1.02]'
                          : 'hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm',
                    !isSystemOff && isTodayDate && !isSelected
                      ? 'bg-primary/5 border-primary/30'
                      : !isSystemOff && !isSelected
                        ? 'bg-card'
                        : '',
                  )}
                >
                  <span
                    className={cn(
                      'text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-colors z-10',
                      isTodayDate && !isSystemOff
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : isHoliday
                          ? 'text-emerald-800 bg-emerald-500/20'
                          : isOptional
                            ? 'text-violet-800 bg-violet-500/20'
                            : isSelected
                              ? 'text-primary'
                              : 'text-foreground/80 group-hover:text-primary',
                    )}
                  >
                    {format(day, 'd')}
                  </span>

                  {isSystemOff ? (
                    <div className="flex flex-col w-full gap-1 mt-auto z-10 items-center justify-center h-full pb-1 sm:pb-2">
                      <span
                        className={cn(
                          'text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center leading-tight px-1',
                          isHoliday ? 'text-emerald-700' : 'text-violet-700',
                        )}
                      >
                        {systemOffRequest.notes || systemOffRequest.employees?.name}
                      </span>
                    </div>
                  ) : (
                    requests.length > 0 && (
                      <div className="flex flex-col w-full gap-1 mt-auto z-10">
                        {/* Mobile view: just dots */}
                        <div className="flex flex-wrap gap-1 sm:hidden">
                          {requests.slice(0, 3).map((req, i) => (
                            <div
                              key={i}
                              className={cn('w-1.5 h-1.5 rounded-full', getTypeColor(req.type))}
                            />
                          ))}
                          {requests.length > 3 && (
                            <span className="text-[9px] text-muted-foreground font-medium leading-none">
                              +{requests.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Desktop view: pills with names */}
                        <div className="hidden sm:flex flex-col gap-1 w-full">
                          {requests.slice(0, 3).map((req, i) => (
                            <div
                              key={i}
                              className={cn(
                                'text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate w-full border border-transparent',
                                req.type === 'FERIAS'
                                  ? 'bg-amber-100 text-amber-700 border-amber-200/50'
                                  : req.type === 'ATESTADO'
                                    ? 'bg-rose-100 text-rose-700 border-rose-200/50'
                                    : req.type === 'ANIVERSARIO'
                                      ? 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200/50'
                                      : 'bg-blue-100 text-blue-700 border-blue-200/50',
                              )}
                              title={`${req.employees?.name} - ${req.type}`}
                            >
                              {req.employees?.name?.split(' ')[0]}
                            </div>
                          ))}
                          {requests.length > 3 && (
                            <div className="text-[10px] text-muted-foreground font-medium pl-1">
                              +{requests.length - 3} mais
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full xl:w-[340px] shrink-0 shadow-lg border-primary/10 bg-gradient-to-b from-card to-muted/20 h-auto">
        <CardHeader className="pb-3 border-b border-border/50 bg-card/50">
          <CardTitle className="text-base flex items-center gap-3">
            <div className="p-1.5 bg-primary/10 rounded-md text-primary">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-normal text-muted-foreground">
                {selectedDate ? format(selectedDate, 'EEEE', { locale: ptBR }) : 'Detalhes do dia'}
              </span>
              <span className="capitalize">
                {selectedDate
                  ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                  : 'Selecione uma data'}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px] xl:h-[450px] p-3">
            {selectedDateRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border/50">
                  <Info className="h-5 w-5 opacity-50" />
                </div>
                <p className="text-sm font-medium">Escala completa neste dia</p>
                <p className="text-xs opacity-70">Nenhuma ausência registrada.</p>
              </div>
            ) : selectedDateRequests.some(
                (r) => r.type === 'FERIADO' || r.type === 'PONTO_FACULTATIVO',
              ) ? (
              <div className="space-y-2.5">
                {selectedDateRequests
                  .filter((r) => r.type === 'FERIADO' || r.type === 'PONTO_FACULTATIVO')
                  .map((req) => {
                    const isFeriado = req.type === 'FERIADO'
                    return (
                      <div
                        key={req.id}
                        className={cn(
                          'p-6 border rounded-xl hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col items-center justify-center text-center space-y-3 mt-4',
                          isFeriado
                            ? 'border-emerald-200 bg-emerald-500/10'
                            : 'border-violet-200 bg-violet-500/10',
                        )}
                      >
                        <div
                          className={cn(
                            'absolute left-0 top-0 bottom-0 w-1.5',
                            isFeriado ? 'bg-emerald-500' : 'bg-violet-500',
                          )}
                        />
                        <Badge
                          variant="outline"
                          className={cn(
                            'uppercase tracking-widest text-[10px] font-bold',
                            isFeriado
                              ? 'bg-emerald-500/20 text-emerald-700 border-emerald-200'
                              : 'bg-violet-500/20 text-violet-700 border-violet-200',
                          )}
                        >
                          {isFeriado ? 'Feriado Nacional' : 'Decreto Municipal'}
                        </Badge>
                        <span
                          className={cn(
                            'font-bold text-xl tracking-tight',
                            isFeriado ? 'text-emerald-800' : 'text-violet-800',
                          )}
                        >
                          {req.notes || req.employees?.name}
                        </span>
                        <p
                          className={cn(
                            'text-sm font-medium px-4',
                            isFeriado ? 'text-emerald-700/80' : 'text-violet-700/80',
                          )}
                        >
                          Não há expediente da equipe neste dia. As ausências individuais não
                          precisam ser gerenciadas.
                        </p>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDateRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 border rounded-xl bg-card hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div
                      className={cn(
                        'absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2',
                        getTypeColor(req.type),
                      )}
                    />
                    <div className="pl-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm tracking-tight">
                          {req.employees?.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] uppercase font-bold tracking-wider',
                            getBadgeStyle(req.type),
                          )}
                        >
                          {req.type}
                        </Badge>
                      </div>
                      <div className="text-xs font-medium text-muted-foreground bg-muted/50 w-fit px-2 py-0.5 rounded-md mb-2">
                        {req.employees?.category}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <CalendarIcon className="h-3 w-3" />
                        {format(new Date(req.start_date), 'dd/MM/yyyy')} até{' '}
                        {format(new Date(req.end_date), 'dd/MM/yyyy')}
                      </div>
                      {req.notes && (
                        <div className="mt-3 pt-3 border-t border-border/50 text-xs italic text-muted-foreground/80">
                          "{req.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
