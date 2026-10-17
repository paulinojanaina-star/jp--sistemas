import { Item } from './inventory'

export type PurchaseOrderStatus = 'PENDING' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'

export interface PurchaseOrder {
  id: string
  request_number: string
  item_id: string
  quantity_ordered: number
  quantity_received: number
  status: PurchaseOrderStatus
  supplier?: string | null
  health_unit_name?: string | null
  requested_at: string
  expected_date?: string | null
  notes?: string | null
  created_at: string
  updated_at: string

  // Joined from items
  item?: Item
  items?: Item
}

export interface CreatePurchaseOrderInput {
  request_number: string
  item_id: string
  quantity_ordered: number
  supplier?: string | null
  health_unit_name?: string | null
  requested_at: string
  expected_date?: string | null
  notes?: string | null
}

export interface RegisterReceiptInput {
  order_id: string
  item_id: string
  quantity_received_now: number
  batch_number?: string | null
  expiry_date?: string | null
  received_at?: string
  observations?: string | null
  health_unit_name: string
}
