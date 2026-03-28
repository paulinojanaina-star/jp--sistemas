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

        const allTimeOffs = [...(timeOffs as any as TimeOffRequest[]), ...birthdayTimeOffs].sort(
          (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
        )

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
    if (id?.startsWith('auto-bday-')) {
      return { error: { message: 'Não é possível editar uma ausência automática de aniversário.' } }
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
    if (id.startsWith('auto-bday-')) {
      return {
        error: {
          message:
            'Não é possível excluir uma ausência automática de aniversário. Remova a data de nascimento do cadastro do profissional caso deseje cancelar.',
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
