import { Item, Movement } from '@/types/inventory'

export function calculateConsumption(item: Item, movements: Movement[]) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonthNumber = now.getMonth() + 1 // 1 = Janeiro, 2 = Fevereiro, etc.

  // Pega todas as saídas do item no ano atual para calcular a média de gastos do ano vigente
  const outMovementsThisYear = movements.filter((m) => {
    if (m.item_id !== item.id || m.type !== 'OUT') return false
    const mDate = new Date(m.created_at || 0)
    return mDate.getFullYear() === currentYear
  })

  const totalConsumptionThisYear = outMovementsThisYear.reduce(
    (sum, m) => sum + Number(m.quantity || 0),
    0,
  )

  // Média mensal baseada no mês do ano vigente (ex: se estamos em março, divide o total do ano por 3)
  const monthlyConsumption = Math.round((totalConsumptionThisYear / currentMonthNumber) * 10) / 10

  // Dias transcorridos no ano para calcular a média diária com precisão
  const startOfYear = new Date(currentYear, 0, 1)
  const daysPassedInYear = Math.max(
    1,
    Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)),
  )

  const dailyConsumption = totalConsumptionThisYear / daysPassedInYear

  let daysUntilStockout = Infinity
  if (dailyConsumption > 0) {
    daysUntilStockout = Number(item.current_quantity || 0) / dailyConsumption
  }

  // Risco de falta se o estoque acabar em <= 40 dias, havendo estoque e histórico
  const isStockoutRisk =
    daysUntilStockout <= 40 &&
    Number(item.current_quantity || 0) > 0 &&
    totalConsumptionThisYear > 0

  return {
    monthlyConsumption,
    dailyConsumption,
    daysUntilStockout,
    isStockoutRisk,
  }
}
