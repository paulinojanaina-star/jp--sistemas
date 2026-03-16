export type ItemCategory = 'Medicação' | 'EPI' | 'Consumíveis' | string
export type ItemUnit = 'Caixa' | 'Frasco' | 'Unidade' | 'Pacote' | string
export type MovementType = 'ENTRADA' | 'SAIDA'

export interface Item {
  id: string
  name: string
  description?: string
  category: ItemCategory
  unit: ItemUnit
  minStock: number
  currentStock: number
}

export interface Movement {
  id: string
  itemId: string
  type: MovementType
  quantity: number
  date: string // YYYY-MM-DD format for simplicity with native inputs
  responsible: string
  unitOriginDest: string
  observation?: string
}
