import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Employee, TimeOffRequest, EmployeeCategory, TimeOffType } from '@/types/team'

interface TeamContextType {
  employees: Employee[]
  timeOffRequests: TimeOffRequest[]
  loading: boolean
  refreshData: () => Promise<void>
  saveEmployee: (
    id: string | null,
    data: { name: string; category: EmployeeCategory; birth_date?: string | null },
  ) => Promise<{ error?: any }>
  deleteEmployee: (id: string) => Promise<{ error?: any }>
  saveTimeOff: (
    id: string | null,
    data: {
      employee_id: string
      type: TimeOffType
      start_date: string
      end_date: string
      notes?: string
    },
  ) => Promise<{ error?: any }>
  deleteTimeOff: (id: string) => Promise<{ error?: any }>
}

export const TeamContext = createContext<TeamContextType | null>(null)

export const TeamProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([])
  const [loading, setLoading] = useState(true)

  const refreshData = async () => {
    setLoading(true)
    const { data: emps, error: empsError } = await supabase
      .from('employees')
      .select('*')
      .order('name')

    if (!empsError && emps) {
      setEmployees(emps as Employee[])

      const { data: timeOffs, error: timeOffsError } = await supabase
        .from('time_off_requests')
        .select('*, employees(name, category)')
        .order('start_date', { ascending: true })

      if (!timeOffsError && timeOffs) {
        const currentYear = new Date().getFullYear()
        const birthdayTimeOffs: TimeOffRequest[] = []

        emps.forEach((emp: any) => {
          if (emp.birth_date) {
            const [, month, day] = emp.birth_date.split('-')

            // Add birthdays for previous, current and next year
            ;[-1, 0, 1].forEach((yearOffset) => {
              const year = currentYear + yearOffset
              const bdayDate = `${year}-${month}-${day}`

              const hasManualBday = timeOffs.some(
                (t: any) =>
                  t.employee_id === emp.id && t.type === 'ANIVERSARIO' && t.start_date === bdayDate,
              )

              if (!hasManualBday) {
                birthdayTimeOffs.push({
                  id: `auto-bday-${emp.id}-${year}`,
                  employee_id: emp.id,
                  type: 'ANIVERSARIO',
                  start_date: bdayDate,
                  end_date: bdayDate,
                  notes: 'Aniversário (Automático)',
                  created_at: new Date().toISOString(),
                  employees: {
                    name: emp.name,
                    category: emp.category as EmployeeCategory,
                  },
                })
              }
            })
          }
        })

        const holidays: any[] = []
        const fixedHolidays = [
          { month: 1, day: 1, name: 'Confraternização Universal' },
          { month: 4, day: 21, name: 'Tiradentes' },
          { month: 5, day: 1, name: 'Dia do Trabalhador' },
          { month: 9, day: 7, name: 'Independência do Brasil' },
          { month: 10, day: 12, name: 'Nossa Senhora Aparecida' },
          { month: 11, day: 2, name: 'Finados' },
          { month: 11, day: 15, name: 'Proclamação da República' },
          { month: 12, day: 25, name: 'Natal' },
        ]

        function getEasterUTC(year: number) {
          const a = year % 19
          const b = Math.floor(year / 100)
          const c = year % 100
          const d = Math.floor(b / 4)
          const e = b % 4
          const f = Math.floor((b + 8) / 25)
          const g = Math.floor((b - f + 1) / 3)
          const h = (19 * a + b - d - g + 15) % 30
          const i = Math.floor(c / 4)
          const k = c % 4
          const l = (32 + 2 * e + 2 * i - h - k) % 7
          const m = Math.floor((a + 11 * h + 22 * l) / 451)
          const month = Math.floor((h + l - 7 * m + 114) / 31)
          const day = ((h + l - 7 * m + 114) % 31) + 1
          return new Date(Date.UTC(year, month - 1, day))
        }

        const createHolidayReq = (idSuffix: string, name: string, dateStr: string) => ({
          id: `auto-holiday-${idSuffix}`,
          employee_id: 'system-holiday',
          type: 'FERIADO' as TimeOffType,
          start_date: dateStr,
          end_date: dateStr,
          notes: 'Feriado Nacional',
          created_at: new Date().toISOString(),
          employees: {
            name: name,
            category: 'FERIADO' as EmployeeCategory,
          },
        })

        const createOptionalReq = (idSuffix: string, name: string, dateStr: string) => ({
          id: `auto-optional-${idSuffix}`,
          employee_id: 'system-optional',
          type: 'PONTO_FACULTATIVO' as TimeOffType,
          start_date: dateStr,
          end_date: dateStr,
          notes: name,
          created_at: new Date().toISOString(),
          employees: {
            name: name,
            category: 'FERIADO' as EmployeeCategory,
          },
        })

        const optionalHolidays2026 = [
          { month: 2, day: 16, name: 'Ponto Facultativo' },
          { month: 2, day: 17, name: 'Ponto Facultativo' },
          { month: 2, day: 18, name: 'Ponto Facultativo' },
          { month: 4, day: 2, name: 'Ponto Facultativo' },
          { month: 4, day: 20, name: 'Ponto Facultativo' },
          { month: 6, day: 5, name: 'Ponto Facultativo' },
          { month: 9, day: 14, name: 'Ponto Facultativo' },
          { month: 10, day: 30, name: 'Ponto Facultativo' },
          { month: 12, day: 7, name: 'Ponto Facultativo' },
          { month: 12, day: 24, name: 'Ponto Facultativo' },
          { month: 12, day: 31, name: 'Ponto Facultativo' },
        ]

        ;[-1, 0, 1].forEach((yearOffset) => {
          const year = currentYear + yearOffset

          fixedHolidays.forEach((h) => {
            const dateStr = `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`
            holidays.push(createHolidayReq(`${year}-${h.month}-${h.day}`, h.name, dateStr))
          })

          const easter = getEasterUTC(year)

          const goodFriday = new Date(easter)
          goodFriday.setUTCDate(easter.getUTCDate() - 2)
          holidays.push(
            createHolidayReq(
              `${year}-goodfriday`,
              'Paixão de Cristo',
              goodFriday.toISOString().split('T')[0],
            ),
          )

          const carnaval = new Date(easter)
          carnaval.setUTCDate(easter.getUTCDate() - 47)
          holidays.push(
            createHolidayReq(`${year}-carnaval`, 'Carnaval', carnaval.toISOString().split('T')[0]),
          )

          const corpus = new Date(easter)
          corpus.setUTCDate(easter.getUTCDate() + 60)
          holidays.push(
            createHolidayReq(
              `${year}-corpus`,
              'Corpus Christi',
              corpus.toISOString().split('T')[0],
            ),
          )

          if (year === 2026) {
            optionalHolidays2026.forEach((h) => {
              const dateStr = `2026-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`
              holidays.push(createOptionalReq(`2026-${h.month}-${h.day}`, h.name, dateStr))
            })
          }
        })

        const allTimeOffs = [
          ...(timeOffs as any as TimeOffRequest[]),
          ...birthdayTimeOffs,
          ...holidays,
        ].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

        setTimeOffRequests(allTimeOffs)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    if (session?.user?.id) {
      refreshData()
    } else {
      setEmployees([])
      setTimeOffRequests([])
    }
  }, [session?.user?.id])

  const saveEmployee = async (
    id: string | null,
    data: { name: string; category: EmployeeCategory; birth_date?: string | null },
  ) => {
    let result
    if (id) {
      result = await supabase.from('employees').update(data).eq('id', id)
    } else {
      result = await supabase.from('employees').insert(data)
    }
    if (result.error) return { error: result.error }
    await refreshData()
    return {}
  }

  const deleteEmployee = async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id)
    if (error) return { error }
    await refreshData()
    return {}
  }

  const saveTimeOff = async (
    id: string | null,
    data: {
      employee_id: string
      type: TimeOffType
      start_date: string
      end_date: string
      notes?: string
    },
  ) => {
    if (id?.startsWith('auto-')) {
      return { error: { message: 'Não é possível editar um registro automático do sistema.' } }
    }
    let result
    if (id) {
      result = await supabase.from('time_off_requests').update(data).eq('id', id)
    } else {
      result = await supabase.from('time_off_requests').insert(data)
    }
    if (result.error) return { error: result.error }
    await refreshData()
    return {}
  }

  const deleteTimeOff = async (id: string) => {
    if (id.startsWith('auto-')) {
      return {
        error: {
          message:
            'Não é possível excluir um registro automático (aniversário, feriado ou ponto facultativo).',
        },
      }
    }
    const { error } = await supabase.from('time_off_requests').delete().eq('id', id)
    if (error) return { error }
    await refreshData()
    return {}
  }

  return (
    <TeamContext.Provider
      value={{
        employees,
        timeOffRequests,
        loading,
        refreshData,
        saveEmployee,
        deleteEmployee,
        saveTimeOff,
        deleteTimeOff,
      }}
    >
      {children}
    </TeamContext.Provider>
  )
}

export const useTeamStore = () => {
  const context = useContext(TeamContext)
  if (!context) throw new Error('useTeamStore must be used within TeamProvider')
  return context
}
