import { Item } from './inventory'

export type PurchaseOrderStatus = 'PENDING' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  item_id: string
  quantity_ordered: number
  quantity_received: number
  unit_price: number
  total_price: number
  status: PurchaseOrderStatus
  created_at?: string
  updated_at?: string

  // Joined from items
  item?: Item
}

export interface PurchaseOrder {
  id: string
  request_number: string
  status: PurchaseOrderStatus
  supplier?: string | null
  health_unit_name?: string | null
  requested_at: string
  expected_date?: string | null
  notes?: string | null
  created_at: string
  updated_at: string

  // Totals of the order header
  total_price: number
  quantity_ordered: number
  quantity_received: number

  // Multi-item support
  order_items: PurchaseOrderItem[]

  // Legacy single item fields for backward compatibility
  item_id?: string | null
  unit_price?: number | null
  item?: Item
}

export interface CreateOrderItemInput {
  item_id: string
  quantity_ordered: number
  unit_price?: number | null
  total_price?: number | null
}

export interface UpdateOrderItemInput {
  id?: string // se já existe na tabela purchase_order_items
  item_id: string
  quantity_ordered: number
  quantity_received?: number
  unit_price?: number | null
  total_price?: number | null
}

export interface UpdatePurchaseOrderInput {
  order_id: string
  request_number: string
  supplier?: string | null
  health_unit_name?: string | null
  requested_at: string
  expected_date?: string | null
  notes?: string | null
  items: UpdateOrderItemInput[]
}

export interface CreatePurchaseOrderInput {
  request_number: string
  items: CreateOrderItemInput[]
  supplier?: string | null
  health_unit_name?: string | null
  requested_at: string
  expected_date?: string | null
  notes?: string | null

  // Legacy single-item fields (supported as fallback)
  item_id?: string
  quantity_ordered?: number
  unit_price?: number | null
  total_price?: number | null
}

export interface ReceiptItemInput {
  order_item_id: string
  item_id: string
  quantity_received_now: number
  unit_price?: number | null
  batch_number?: string | null
  expiry_date?: string | null
}

export interface RegisterReceiptInput {
  order_id: string
  received_at?: string
  health_unit_name: string
  observations?: string | null
  items: ReceiptItemInput[]

  // Legacy single-item fields (supported as fallback)
  item_id?: string
  quantity_received_now?: number
  unit_price?: number | null
  batch_number?: string | null
  expiry_date?: string | null
}
