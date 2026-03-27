export type EmployeeCategory = 'MEDICO' | 'ENFERMEIRO' | 'AUXILIAR' | 'TECNICO'
export type TimeOffType = 'FERIAS' | 'FOLGA' | 'ATESTADO'

export interface Employee {
  id: string
  name: string
  category: EmployeeCategory
  created_at: string
}

export interface TimeOffRequest {
  id: string
  employee_id: string
  type: TimeOffType
  start_date: string
  end_date: string
  notes: string | null
  created_at: string
  employees?: {
    name: string
    category: EmployeeCategory
  }
}
