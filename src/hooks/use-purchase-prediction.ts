import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'

export type RiskLevel = 'critical' | 'warning' | 'stable' | 'no-data'

export interface PredictionItem {
  id: string
  name: string
  unit_type: string
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
}

export interface UsePurchasePredictionResult {
  loading: boolean
  items: PredictionItem[]
  healthUnits: string[]
}

const CONSUMPTION_TYPES = ['OUT', 'SPECIAL_OUT']

export function usePurchasePrediction(
  periodDays: number,
  healthUnit: string | null,
): UsePurchasePredictionResult {
  const [loading, setLoading] = useState(true)
  const [rawItems, setRawItems] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [healthUnits, setHealthUnits] = useState<string[]>([])

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
        const [{ data: itemsData }, { data: movementsData }, { data: unitsData }] =
          await Promise.all([
            supabase.from('items').select('id, name, unit_type, current_quantity, min_quantity'),
            supabase
              .from('inventory_movements')
              .select('item_id, quantity, type, created_at, health_unit_name')
              .in('type', CONSUMPTION_TYPES)
              .gte('created_at', periodStart),
            supabase
              .from('inventory_movements')
              .select('health_unit_name')
              .not('health_unit_name', 'is', null),
          ])

        if (!isMounted) return

        setRawItems(itemsData || [])
        setMovements(movementsData || [])

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

        return {
          id: item.id,
          name: item.name || 'Desconhecido',
          unit_type: item.unit_type || '',
          current_quantity: currentQty,
          min_quantity: minQty,
          adc,
          daysUntilCritical,
          daysUntilZero,
          predictedCriticalDate,
          predictedZeroDate,
          suggestedRestockDate,
          riskLevel,
          totalConsumed,
          movementCount,
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
  }, [rawItems, movements, healthUnit, periodDays])

  return { loading, items, healthUnits }
}
