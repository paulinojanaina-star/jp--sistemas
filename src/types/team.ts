export type EmployeeCategory =
  | 'MEDICO'
  | 'ENFERMEIRO'
  | 'AUXILIAR'
  | 'TECNICO'
  | 'AGENTE'
  | 'GERENTE'
export type TimeOffType =
  | 'FERIAS'
  | 'FOLGA'
  | 'ATESTADO'
  | 'ANIVERSARIO'
  | 'FERIADO'
  | 'PONTO_FACULTATIVO'

export interface Employee {
  id: string
  name: string
  category: EmployeeCategory
  created_at: string
  birth_date?: string | null
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
