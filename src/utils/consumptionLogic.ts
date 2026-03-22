import { Item, Movement } from '@/types/inventory'

export function calculateConsumption(item: Item, movements: Movement[], periodInMonths?: number) {
  const now = new Date()

  let totalConsumption = 0
  let monthlyConsumption = 0
  let dailyConsumption = 0
  let validMovements: Movement[] = []

  if (periodInMonths) {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - periodInMonths)

    validMovements = movements.filter((m) => {
      if (m.item_id !== item.id || m.type !== 'OUT') return false
      const mDate = new Date(m.created_at || 0)
      return mDate >= startDate && mDate <= now
    })

    totalConsumption = validMovements.reduce((sum, m) => sum + Number(m.quantity || 0), 0)

    // Média mensal baseada no número de meses selecionado
    monthlyConsumption = Math.round((totalConsumption / periodInMonths) * 10) / 10

    // Dias transcorridos no período para calcular a média diária com precisão
    const daysPassed = Math.max(
      1,
      Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    )
    dailyConsumption = totalConsumption / daysPassed
  } else {
    // Lógica padrão: Ano Atual (YTD)
    const currentYear = now.getFullYear()
    const currentMonthNumber = now.getMonth() + 1 // 1 = Janeiro, 2 = Fevereiro, etc.

    // Pega todas as saídas do item no ano atual para calcular a média de gastos do ano vigente
    validMovements = movements.filter((m) => {
      if (m.item_id !== item.id || m.type !== 'OUT') return false
      const mDate = new Date(m.created_at || 0)
      return mDate.getFullYear() === currentYear
    })

    totalConsumption = validMovements.reduce((sum, m) => sum + Number(m.quantity || 0), 0)

    // Média mensal baseada no mês do ano vigente (ex: se estamos em março, divide o total do ano por 3)
    monthlyConsumption = Math.round((totalConsumption / currentMonthNumber) * 10) / 10

    // Dias transcorridos no ano para calcular a média diária com precisão
    const startOfYear = new Date(currentYear, 0, 1)
    const daysPassedInYear = Math.max(
      1,
      Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)),
    )

    dailyConsumption = totalConsumption / daysPassedInYear
  }

  let daysUntilStockout = Infinity
  if (dailyConsumption > 0) {
    daysUntilStockout = Number(item.current_quantity || 0) / dailyConsumption
  }

  // Risco de falta se o estoque acabar em <= 40 dias, havendo estoque e histórico
  const isStockoutRisk =
    daysUntilStockout <= 40 && Number(item.current_quantity || 0) > 0 && totalConsumption > 0

  return {
    monthlyConsumption,
    dailyConsumption,
    daysUntilStockout,
    isStockoutRisk,
  }
}
