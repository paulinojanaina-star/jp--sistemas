import { Item, Movement } from '@/types/inventory'

export function calculateConsumption(item: Item, movements: Movement[], periodInMonths?: number) {
  const now = new Date()
  const ROLLING_DAYS = 90

  const daysToLookBack = periodInMonths ? periodInMonths * 30 : ROLLING_DAYS
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysToLookBack)

  const validMovements = movements.filter((m) => {
    if (m.item_id !== item.id || m.type !== 'OUT') return false
    const mDate = new Date(m.created_at || 0)
    return mDate >= startDate && mDate <= now
  })

  const totalConsumption = validMovements.reduce((sum, m) => sum + Number(m.quantity || 0), 0)

  const dailyConsumption = totalConsumption / daysToLookBack
  const monthlyConsumption = Math.round(dailyConsumption * 30 * 10) / 10

  let daysUntilStockout = Infinity
  if (dailyConsumption > 0) {
    daysUntilStockout = Number(item.current_quantity || 0) / dailyConsumption
  }

  const isStockoutRisk =
    daysUntilStockout <= 40 && Number(item.current_quantity || 0) > 0 && totalConsumption > 0

  return {
    monthlyConsumption,
    dailyConsumption,
    daysUntilStockout,
    isStockoutRisk,
  }
}
