import { Item, Movement } from '@/types/inventory'

export function calculateConsumption(item: Item, movements: Movement[]) {
  const now = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(now.getDate() - 30)

  // Get all OUT movements for this item in the last 30 days
  const recentOutMovements = movements.filter((m) => {
    if (m.item_id !== item.id || m.type !== 'OUT') return false
    const mDate = new Date(m.created_at || 0)
    return mDate >= thirtyDaysAgo
  })

  const monthlyConsumption = recentOutMovements.reduce((sum, m) => sum + Number(m.quantity || 0), 0)
  const dailyConsumption = monthlyConsumption / 30

  let daysUntilStockout = Infinity
  if (dailyConsumption > 0) {
    daysUntilStockout = Number(item.current_quantity || 0) / dailyConsumption
  }

  // Risk if stock ends in <= 60 days, and there's actually some stock and consumption
  const isStockoutRisk =
    daysUntilStockout <= 60 && Number(item.current_quantity || 0) > 0 && monthlyConsumption > 0

  return {
    monthlyConsumption,
    dailyConsumption,
    daysUntilStockout,
    isStockoutRisk,
  }
}
