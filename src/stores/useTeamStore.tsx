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
    data: { name: string; category: EmployeeCategory },
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

  const fetchEmployees = async () => {
    const { data, error } = await supabase.from('employees').select('*').order('name')
    if (!error && data) setEmployees(data as Employee[])
  }

  const fetchTimeOffs = async () => {
    const { data, error } = await supabase
      .from('time_off_requests')
      .select('*, employees(name, category)')
      .order('start_date', { ascending: true })
    if (!error && data) setTimeOffRequests(data as any as TimeOffRequest[])
  }

  const refreshData = async () => {
    setLoading(true)
    await Promise.all([fetchEmployees(), fetchTimeOffs()])
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
    data: { name: string; category: EmployeeCategory },
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
