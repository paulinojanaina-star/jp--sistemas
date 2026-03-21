import { Movement, Item } from '@/types/inventory'

export function parseDateSafe(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null
  try {
    const datePart = dateStr.split('T')[0]
    const parts = datePart.split('-')
    if (parts.length !== 3) return null

    const y = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10) - 1
    const d = parseInt(parts[2].substring(0, 2), 10)

    if (isNaN(y) || isNaN(m) || isNaN(d)) return null

    return new Date(y, m, d)
  } catch (e) {
    return null
  }
}

export function getActiveBatches(item: Item, movements: Movement[]) {
  const currentQuantity = Number(item.current_quantity) || 0
  if (currentQuantity <= 0) return []

  // Sort newest first to assume FIFO (oldest consumed first, newest are still in stock)
  const inMovements = movements
    .filter((m) => m.item_id === item.id && m.type === 'IN')
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())

  let remainingStock = currentQuantity
  const activeBatches = []

  for (const m of inMovements) {
    if (remainingStock <= 0) break
    activeBatches.push(m)
    remainingStock -= Number(m.quantity) || 0
  }

  return activeBatches
}

export function getNearestExpiry(item: Item, movements: Movement[]) {
  const activeBatches = getActiveBatches(item, movements)
  const batchesWithExpiry = activeBatches.filter((m) => m.expiry_date)

  if (batchesWithExpiry.length === 0) return null

  const expiries = batchesWithExpiry
    .map((m) => {
      const parsedDate = parseDateSafe(m.expiry_date)
      if (!parsedDate) return null

      return {
        date: parsedDate,
        batch: m.batch_number,
        movement_id: m.id,
      }
    })
    .filter(Boolean) as Array<{
    date: Date
    batch: string | null | undefined
    movement_id: string
  }>

  if (expiries.length === 0) return null

  return expiries.sort((a, b) => a.date.getTime() - b.date.getTime())[0] // Nearest expiry among active stock
}
