export type ItemCategory = 'Medicação' | 'EPI' | 'Consumíveis' | string
export type ItemUnit = 'Rolo' | 'Frasco' | 'Litro' | 'Unidade' | string
export type MovementType = 'IN' | 'OUT'

export interface Item {
  id: string
  name: string
  description?: string
  category: ItemCategory
  unit_type: ItemUnit
  min_quantity: number
  current_quantity: number
  created_at: string
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

  // Joined fields from Supabase
  items?: { name: string }
  profiles?: { email: string; full_name: string }
}
