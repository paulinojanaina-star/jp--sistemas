import { Item } from './inventory'

export type PriceHistorySourceType =
  | 'PURCHASE_ORDER'
  | 'RECEIPT'
  | 'MANUAL_ADJUSTMENT'
  | 'INITIAL_CATALOG'

export interface ItemPriceHistoryEntry {
  id: string
  item_id: string
  purchase_order_id?: string | null
  purchase_order_item_id?: string | null
  request_number?: string | null
  supplier?: string | null
  health_unit_name?: string | null
  unit_price: number
  quantity: number
  total_price: number
  source_type: PriceHistorySourceType
  record_date: string // YYYY-MM-DD
  created_at: string
  item?: Item | null
}

export interface ItemPriceMetrics {
  currentPrice: number
  lastPrice: number
  minPrice: number
  maxPrice: number
  avgPrice: number
  previousPrice: number | null
  changeVsPreviousPercent: number | null
  changeVsAvgPercent: number | null
  totalPurchasesCount: number
  distinctSuppliersCount: number
  lastSupplier: string | null
  lastPurchaseDate: string | null
  isIncreaseAlert: boolean // true if > configured threshold (e.g. 10%)
}

export interface ItemPriceSpikeRanking {
  item_id: string
  item_name: string
  unit_type?: string | null
  current_quantity: number
  supplier: string | null
  latestPrice: number
  previousOrAvgPrice: number
  increasePercent: number
  latestDate: string
  historyCount: number
}
