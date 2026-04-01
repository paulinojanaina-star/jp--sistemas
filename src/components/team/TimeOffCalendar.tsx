import { useState } from 'react'
import { TimeOffRequest } from '@/types/team'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  requests: TimeOffRequest[]
}

export function TimeOffCalendar({ requests }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const todayStr = new Date().toISOString().split('T')[0]

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  const prevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const getCalendarBadgeStyle = (type: string) => {
    if (type === 'FERIAS') return 'bg-amber-100 text-amber-700 border-amber-200'
    if (type === 'ATESTADO') return 'bg-rose-100 text-rose-700 border-rose-200'
    if (type === 'FERIADO') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    return 'bg-blue-100 text-blue-700 border-blue-200'
  }

  return (
    <div className="bg-card border border-border/50 rounded-xl shadow-sm p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-foreground capitalize">
          {monthNames[currentMonth.getMonth()]} de {currentMonth.getFullYear()}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
          <div key={d} className="text-xs font-semibold text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanks.map((b) => (
          <div key={`blank-${b}`} className="p-2" />
        ))}
        {days.map((d) => {
          const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const dayRequests = requests.filter(
            (r) => r.start_date <= dateStr && r.end_date >= dateStr,
          )
          const isToday = dateStr === todayStr

          return (
            <div
              key={d}
              className={`min-h-[80px] sm:min-h-[100px] p-1.5 border rounded-lg transition-colors ${isToday ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'bg-muted/10 hover:bg-muted/30'}`}
            >
              <div
                className={`text-xs font-medium mb-1.5 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {d}
              </div>
              <div className="flex flex-col gap-1">
                {dayRequests.map((r) => (
                  <div
                    key={r.id}
                    className={`text-[10px] px-1.5 py-0.5 rounded border truncate cursor-default ${getCalendarBadgeStyle(r.type)}`}
                    title={`${r.employees?.name} - ${r.type}`}
                  >
                    {r.employees?.name.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
