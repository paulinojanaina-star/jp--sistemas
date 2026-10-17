import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'

export type RiskLevel = 'critical' | 'warning' | 'stable' | 'no-data'

export interface PredictionItem {
  id: string
  name: string
  unit_type: string
  supplier: string | null
  unit_price: number
  current_quantity: number
  min_quantity: number
  adc: number
  daysUntilCritical: number | null
  daysUntilZero: number | null
  predictedCriticalDate: string | null
  predictedZeroDate: string | null
  suggestedRestockDate: string | null
  riskLevel: RiskLevel
  totalConsumed: number
  movementCount: number
  inRouteQuantity: number
  rawSuggestedQuantity: number
  suggestedQuantity: number
  isCoveredInRoute: boolean
}

export interface UsePurchasePredictionResult {
  loading: boolean
  items: PredictionItem[]
  healthUnits: string[]
}

const CONSUMPTION_TYPES = ['OUT']

export function usePurchasePrediction(
  periodDays: number,
  healthUnit: string | null,
): UsePurchasePredictionResult {
  const [loading, setLoading] = useState(true)
  const [rawItems, setRawItems] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [healthUnits, setHealthUnits] = useState<string[]>([])
  const [inRouteMap, setInRouteMap] = useState<Map<string, number>>(new Map())

  const periodStart = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - periodDays)
    return d.toISOString()
  }, [periodDays])

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      setLoading(true)
      try {
        const [
          { data: itemsData },
          { data: movementsData },
          { data: unitsData },
          { data: orderItemsData },
        ] = await Promise.all([
          supabase
            .from('items')
            .select('id, name, unit_type, current_quantity, min_quantity, supplier, unit_price'),
          supabase
            .from('inventory_movements')
            .select('item_id, quantity, type, created_at, health_unit_name')
            .in('type', CONSUMPTION_TYPES)
            .gte('created_at', periodStart),
          supabase
            .from('inventory_movements')
            .select('health_unit_name')
            .not('health_unit_name', 'is', null),
          (supabase as any).from('purchase_order_items').select(`
              item_id,
              quantity_ordered,
              quantity_received,
              status,
              purchase_orders!inner (
                id,
                status
              )
            `),
        ])

        if (!isMounted) return

        setRawItems(itemsData || [])
        setMovements(movementsData || [])

        // Map pending quantity in route per item for active purchase orders (PENDING and PARTIAL)
        const inRouteByItem = new Map<string, number>()
        ;(orderItemsData || []).forEach((row: any) => {
          const orderStatus = row.purchase_orders?.status
          // Only active orders: PENDING and PARTIAL (exclude RECEIVED and CANCELLED)
          if (orderStatus === 'PENDING' || orderStatus === 'PARTIAL') {
            const ordered = Number(row.quantity_ordered) || 0
            const received = Number(row.quantity_received) || 0
            const pending = Math.max(0, ordered - received)
            if (pending > 0 && row.item_id) {
              const current = inRouteByItem.get(row.item_id) || 0
              inRouteByItem.set(row.item_id, current + pending)
            }
          }
        })
        setInRouteMap(inRouteByItem)

        const uniqueUnits = [
          ...new Set((unitsData || []).map((d: any) => d.health_unit_name).filter(Boolean)),
        ].sort() as string[]
        setHealthUnits(uniqueUnits)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    return () => {
      isMounted = false
    }
  }, [periodStart])

  const items: PredictionItem[] = useMemo(() => {
    const filteredMovements = healthUnit
      ? movements.filter((m) => m.health_unit_name === healthUnit)
      : movements

    const consumptionByItem = new Map<string, { total: number; count: number }>()

    filteredMovements.forEach((m) => {
      const existing = consumptionByItem.get(m.item_id) || { total: 0, count: 0 }
      existing.total += Number(m.quantity) || 0
      existing.count += 1
      consumptionByItem.set(m.item_id, existing)
    })

    const now = new Date()

    return rawItems
      .map((item) => {
        const consumed = consumptionByItem.get(item.id)
        const totalConsumed = consumed?.total ?? 0
        const movementCount = consumed?.count ?? 0

        const adc = totalConsumed / periodDays

        const currentQty = Number(item.current_quantity) || 0
        const minQty = Number(item.min_quantity) || 0

        let daysUntilCritical: number | null = null
        let daysUntilZero: number | null = null
        let predictedCriticalDate: string | null = null
        let predictedZeroDate: string | null = null
        let suggestedRestockDate: string | null = null
        let riskLevel: RiskLevel = 'no-data'

        if (adc > 0 && movementCount > 0) {
          daysUntilZero = Math.floor(currentQty / adc)

          const bufferAboveMin = currentQty - minQty
          if (bufferAboveMin > 0) {
            daysUntilCritical = Math.floor(bufferAboveMin / adc)
          } else {
            daysUntilCritical = 0
          }

          if (daysUntilCritical !== null) {
            const critDate = new Date(now)
            critDate.setDate(critDate.getDate() + daysUntilCritical)
            predictedCriticalDate = critDate.toISOString().split('T')[0]
          }

          const zeroDate = new Date(now)
          zeroDate.setDate(zeroDate.getDate() + daysUntilZero)
          predictedZeroDate = zeroDate.toISOString().split('T')[0]

          const restockDays = daysUntilCritical !== null ? Math.max(0, daysUntilCritical - 3) : 0
          const restockDate = new Date(now)
          restockDate.setDate(restockDate.getDate() + restockDays)
          suggestedRestockDate = restockDate.toISOString().split('T')[0]

          if (daysUntilCritical <= 7) {
            riskLevel = 'critical'
          } else if (daysUntilCritical <= 15) {
            riskLevel = 'warning'
          } else {
            riskLevel = 'stable'
          }
        } else if (adc === 0 && movementCount === 0) {
          riskLevel = 'no-data'
        } else if (adc === 0 && movementCount > 0) {
          riskLevel = 'stable'
        }

        // Raw suggested replenishment quantity based on target stock
        // Rule: Target Stock = min_quantity + 30 days of consumption (adc * 30)
        // If current stock < target stock, raw replenishment = target stock - current stock
        // Otherwise, if current stock is below min, at least (min - current)
        const monthlyConsumption = Math.ceil(adc * 30)
        const targetStock = minQty + monthlyConsumption
        const rawSuggestedQuantity = Math.max(0, Math.ceil(targetStock - currentQty))

        const inRouteQuantity = inRouteMap.get(item.id) || 0
        const suggestedQuantity = Math.max(0, rawSuggestedQuantity - inRouteQuantity)
        const isCoveredInRoute = rawSuggestedQuantity > 0 && inRouteQuantity >= rawSuggestedQuantity

        return {
          id: item.id,
          name: item.name || 'Desconhecido',
          unit_type: item.unit_type || '',
          supplier: item.supplier || null,
          unit_price: Number(item.unit_price) || 0,
          current_quantity: currentQty,
          min_quantity: minQty,
          adc,
          daysUntilCritical: daysUntilCritical,
          daysUntilZero: daysUntilZero,
          predictedCriticalDate,
          predictedZeroDate,
          suggestedRestockDate,
          riskLevel,
          totalConsumed,
          movementCount,
          inRouteQuantity,
          rawSuggestedQuantity,
          suggestedQuantity,
          isCoveredInRoute,
        }
      })
      .sort((a, b) => {
        const order: Record<RiskLevel, number> = {
          critical: 0,
          warning: 1,
          stable: 2,
          'no-data': 3,
        }
        if (order[a.riskLevel] !== order[b.riskLevel]) {
          return order[a.riskLevel] - order[b.riskLevel]
        }
        if (a.daysUntilCritical !== null && b.daysUntilCritical !== null) {
          return a.daysUntilCritical - b.daysUntilCritical
        }
        return a.name.localeCompare(b.name)
      })
  }, [rawItems, movements, healthUnit, periodDays, inRouteMap])

  return { loading, items, healthUnits }
}
