import { Item, Movement } from '@/types/inventory'

export function calculateConsumption(item: Item, movements: Movement[]) {
  const now = new Date()
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(now.getDate() - 90)

  // Get all OUT movements for this item in the last 90 days to establish a reliable average
  const recentOutMovements = movements.filter((m) => {
    if (m.item_id !== item.id || m.type !== 'OUT') return false
    const mDate = new Date(m.created_at || 0)
    return mDate >= ninetyDaysAgo
  })

  const totalConsumption = recentOutMovements.reduce((sum, m) => sum + Number(m.quantity || 0), 0)

  // Average per month over the 3 months (90 days window)
  const monthlyConsumption = Math.round((totalConsumption / 3) * 10) / 10
  const dailyConsumption = totalConsumption / 90

  let daysUntilStockout = Infinity
  if (dailyConsumption > 0) {
    daysUntilStockout = Number(item.current_quantity || 0) / dailyConsumption
  }

  // Risk if stock ends in <= 60 days, and there's actually some stock and historical consumption
  const isStockoutRisk =
    daysUntilStockout <= 60 && Number(item.current_quantity || 0) > 0 && totalConsumption > 0

  return {
    monthlyConsumption,
    dailyConsumption,
    daysUntilStockout,
    isStockoutRisk,
  }
}
