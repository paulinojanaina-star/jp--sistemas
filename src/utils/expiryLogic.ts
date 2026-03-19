import { Movement, Item } from '@/types/inventory'

export function getActiveBatches(item: Item, movements: Movement[]) {
  const currentQuantity = Number(item.current_quantity) || 0
  if (currentQuantity <= 0) return []

  // Sort newest first to assume FIFO (oldest consumed first, newest are still in stock)
  const inMovements = movements
    .filter((m) => m.item_id === item.id && m.type === 'IN')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

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
      if (!m.expiry_date) return null
      const parts = m.expiry_date.split('-')
      if (parts.length !== 3) return null

      const [y, mo, d] = parts
      return {
        date: new Date(Number(y), Number(mo) - 1, Number(d)),
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
