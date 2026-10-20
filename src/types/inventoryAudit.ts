export interface InventoryAuditSession {
  id: string
  health_unit_name: string
  responsible_id: string
  justification: string
  status: 'COMPLETED' | 'DRAFT' | 'CANCELLED'
  total_items_checked: number
  divergent_items_count: number
  positive_adjustments_count: number
  negative_adjustments_count: number
  created_at: string
  updated_at: string
  profiles?: {
    email?: string
    full_name?: string
  }
}

export interface InventoryAuditSessionItem {
  id: string
  session_id: string
  item_id: string
  system_quantity: number
  counted_quantity: number
  difference: number
  adjustment_type: 'INVENTORY_ADJUST_IN' | 'INVENTORY_ADJUST_OUT' | null
  movement_id: string | null
  notes: string | null
  created_at: string
  items?: {
    name: string
    unit_type?: string
  }
}

export interface InventoryCountItemInput {
  itemId: string
  countedQuantity: number
  systemQuantity: number
  notes?: string
}

export interface SaveInventoryAuditInput {
  healthUnitName: string
  responsibleId: string
  justification: string
  items: InventoryCountItemInput[]
}
