import { supabase } from '@/lib/supabase/client'
import {
  ItemPriceHistoryEntry,
  ItemPriceMetrics,
  ItemPriceSpikeRanking,
  PriceHistorySourceType,
} from '@/types/priceHistory'

export const PRICE_INCREASE_ALERT_THRESHOLD = 10 // 10% threshold

export async function fetchPriceHistory(
  itemId?: string,
): Promise<{ data: ItemPriceHistoryEntry[] | null; error: any }> {
  let query = (supabase as any)
    .from('item_price_history')
    .select('*, items(*)')
    .order('record_date', { ascending: true })
    .order('created_at', { ascending: true })

  if (itemId) {
    query = query.eq('item_id', itemId)
  }

  const { data, error } = await query

  if (error) return { data: null, error }

  const formatted: ItemPriceHistoryEntry[] = (data || []).map((row: any) => ({
    id: row.id,
    item_id: row.item_id,
    purchase_order_id: row.purchase_order_id,
    purchase_order_item_id: row.purchase_order_item_id,
    request_number: row.request_number,
    supplier: row.supplier || 'Não informado',
    health_unit_name: row.health_unit_name,
    unit_price: Number(row.unit_price || 0),
    quantity: Number(row.quantity || 1),
    total_price: Number(row.total_price || 0),
    source_type: (row.source_type || 'PURCHASE_ORDER') as PriceHistorySourceType,
    record_date: row.record_date,
    created_at: row.created_at,
    item: row.items,
  }))

  return { data: formatted, error: null }
}

export async function recordPriceHistoryEntry(entry: {
  item_id: string
  purchase_order_id?: string | null
  purchase_order_item_id?: string | null
  request_number?: string | null
  supplier?: string | null
  health_unit_name?: string | null
  unit_price: number
  quantity: number
  total_price?: number
  source_type: PriceHistorySourceType
  record_date?: string
}): Promise<{ error: any }> {
  if (!entry.item_id || !entry.unit_price || entry.unit_price <= 0) {
    return { error: null }
  }

  const totalPrice =
    entry.total_price !== undefined ? entry.total_price : entry.unit_price * (entry.quantity || 1)

  const payload: any = {
    item_id: entry.item_id,
    purchase_order_id: entry.purchase_order_id || null,
    purchase_order_item_id: entry.purchase_order_item_id || null,
    request_number: entry.request_number || null,
    supplier: entry.supplier?.trim() || 'Não informado',
    health_unit_name: entry.health_unit_name?.trim() || null,
    unit_price: entry.unit_price,
    quantity: entry.quantity > 0 ? entry.quantity : 1,
    total_price: totalPrice >= 0 ? totalPrice : 0,
    source_type: entry.source_type,
    record_date: entry.record_date || new Date().toISOString().split('T')[0],
  }

  const { error } = await (supabase as any).from('item_price_history').insert(payload)
  return { error }
}

export function calculateItemPriceMetrics(
  history: ItemPriceHistoryEntry[],
  currentCatalogPrice?: number,
): ItemPriceMetrics {
  if (!history || history.length === 0) {
    const fallbackPrice = currentCatalogPrice || 0
    return {
      currentPrice: fallbackPrice,
      lastPrice: fallbackPrice,
      minPrice: fallbackPrice,
      maxPrice: fallbackPrice,
      avgPrice: fallbackPrice,
      previousPrice: null,
      changeVsPreviousPercent: null,
      changeVsAvgPercent: null,
      totalPurchasesCount: 0,
      distinctSuppliersCount: 0,
      lastSupplier: null,
      lastPurchaseDate: null,
      isIncreaseAlert: false,
    }
  }

  // Sort chronological
  const sorted = [...history].sort(
    (a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime(),
  )

  const prices = sorted.map((h) => h.unit_price).filter((p) => p > 0)
  if (prices.length === 0) {
    const fallbackPrice = currentCatalogPrice || 0
    return {
      currentPrice: fallbackPrice,
      lastPrice: fallbackPrice,
      minPrice: fallbackPrice,
      maxPrice: fallbackPrice,
      avgPrice: fallbackPrice,
      previousPrice: null,
      changeVsPreviousPercent: null,
      changeVsAvgPercent: null,
      totalPurchasesCount: history.length,
      distinctSuppliersCount: 0,
      lastSupplier: null,
      lastPurchaseDate: null,
      isIncreaseAlert: false,
    }
  }

  const latestEntry = sorted[sorted.length - 1]
  const lastPrice = latestEntry.unit_price
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  // Weighted average or simple average? Weighted by quantity gives real acquisition cost
  const totalSpend = sorted.reduce((acc, h) => acc + h.unit_price * h.quantity, 0)
  const totalQty = sorted.reduce((acc, h) => acc + h.quantity, 0)
  const avgPrice =
    totalQty > 0 ? totalSpend / totalQty : prices.reduce((a, b) => a + b, 0) / prices.length

  const previousEntry = sorted.length > 1 ? sorted[sorted.length - 2] : null
  const previousPrice = previousEntry ? previousEntry.unit_price : null

  let changeVsPreviousPercent: number | null = null
  if (previousPrice !== null && previousPrice > 0) {
    changeVsPreviousPercent = ((lastPrice - previousPrice) / previousPrice) * 100
  }

  let changeVsAvgPercent: number | null = null
  if (avgPrice > 0) {
    changeVsAvgPercent = ((lastPrice - avgPrice) / avgPrice) * 100
  }

  const suppliers = new Set(
    sorted.map((h) => h.supplier).filter((s): s is string => Boolean(s && s.trim())),
  )

  const isIncreaseAlert =
    (changeVsPreviousPercent !== null &&
      changeVsPreviousPercent >= PRICE_INCREASE_ALERT_THRESHOLD) ||
    (changeVsAvgPercent !== null && changeVsAvgPercent >= PRICE_INCREASE_ALERT_THRESHOLD)

  return {
    currentPrice: currentCatalogPrice ?? lastPrice,
    lastPrice,
    minPrice,
    maxPrice,
    avgPrice,
    previousPrice,
    changeVsPreviousPercent:
      changeVsPreviousPercent !== null ? Number(changeVsPreviousPercent.toFixed(1)) : null,
    changeVsAvgPercent: changeVsAvgPercent !== null ? Number(changeVsAvgPercent.toFixed(1)) : null,
    totalPurchasesCount: history.length,
    distinctSuppliersCount: suppliers.size,
    lastSupplier: latestEntry.supplier || null,
    lastPurchaseDate: latestEntry.record_date,
    isIncreaseAlert,
  }
}

export function calculateSpikeRanking(
  allHistory: ItemPriceHistoryEntry[],
  itemsMap: Map<string, any>,
  daysLimit = 90,
  minThresholdPercent = 5,
): ItemPriceSpikeRanking[] {
  // Group by item_id
  const byItem = new Map<string, ItemPriceHistoryEntry[]>()
  for (const entry of allHistory) {
    if (!byItem.has(entry.item_id)) {
      byItem.set(entry.item_id, [])
    }
    byItem.get(entry.item_id)!.push(entry)
  }

  const ranking: ItemPriceSpikeRanking[] = []
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysLimit)

  for (const [itemId, entries] of byItem.entries()) {
    if (entries.length < 2) continue

    const sorted = [...entries].sort(
      (a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime(),
    )

    const latest = sorted[sorted.length - 1]
    const latestDate = new Date(latest.record_date)

    // Consider either within days limit or compare latest vs previous
    const previous = sorted[sorted.length - 2]
    const itemData = itemsMap.get(itemId) || latest.item

    const latestPrice = latest.unit_price
    const previousPrice = previous.unit_price

    if (previousPrice <= 0 || latestPrice <= previousPrice) {
      continue
    }

    const increasePercent = ((latestPrice - previousPrice) / previousPrice) * 100

    if (increasePercent >= minThresholdPercent) {
      ranking.push({
        item_id: itemId,
        item_name: itemData?.name || 'Item não identificado',
        unit_type: itemData?.unit_type || 'UN',
        current_quantity: Number(itemData?.current_quantity || 0),
        supplier: latest.supplier || itemData?.supplier || 'Não informado',
        latestPrice,
        previousOrAvgPrice: previousPrice,
        increasePercent: Number(increasePercent.toFixed(1)),
        latestDate: latest.record_date,
        historyCount: entries.length,
      })
    }
  }

  // Sort descending by highest percentage increase
  return ranking.sort((a, b) => b.increasePercent - a.increasePercent)
}
