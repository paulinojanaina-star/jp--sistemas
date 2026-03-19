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
      const [y, mo, d] = m.expiry_date!.split('-')
      return {
        date: new Date(Number(y), Number(mo) - 1, Number(d)),
        batch: m.batch_number,
        movement_id: m.id,
      }
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  return expiries[0] // Nearest expiry among active stock
}
