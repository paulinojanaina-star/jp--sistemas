export const ITEM_UNITS = ['Caixa', 'Unidade', 'Rolo', 'Litro', 'Frasco', 'Par', 'Pacote'] as const

export type ItemUnit = (typeof ITEM_UNITS)[number] | string
export type MovementType = 'IN' | 'OUT'

export interface Item {
  id: string
  name: string
  description?: string
  unit_type: ItemUnit
  min_quantity: number
  current_quantity: number
  created_at: string
  supplier?: string | null
}

export interface Movement {
  id: string
  item_id: string
  type: MovementType
  quantity: number
  created_at: string
  health_unit_name: string
  responsible_id: string
  observations?: string
  document_url?: string
  batch_number?: string | null
  manufacturing_date?: string | null
  expiry_date?: string | null

  // Joined fields from Supabase
  items?: { name: string }
  profiles?: { email: string; full_name: string }
}
