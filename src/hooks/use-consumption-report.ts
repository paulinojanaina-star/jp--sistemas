import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface ConsumptionMetrics {
  totalConsumed: number
  dailyAverage: number
  totalItems: number
  previousTotal: number
  variationPercentage: number
  topVariationItem: { name: string; variation: number } | null
}

export interface BarChartData {
  name: string
  consumido: number
}

export interface LineChartData {
  date: string
  quantity: number
}

export interface UseConsumptionReportResult {
  loading: boolean
  metrics: ConsumptionMetrics | null
  barData: BarChartData[]
  lineData: LineChartData[]
  items: { id: string; name: string }[]
  healthUnits: string[]
}

interface DateRange {
  start: Date
  end: Date
}

const CONSUMPTION_TYPES = ['OUT', 'SPECIAL_OUT']

function getPreviousRange(range: DateRange): DateRange {
  const durationMs = range.end.getTime() - range.start.getTime()
  return {
    start: new Date(range.start.getTime() - durationMs - 86400000),
    end: new Date(range.start.getTime() - 86400000),
  }
}

export function useConsumptionReport(
  dateRange: DateRange,
  healthUnit: string | null,
  selectedItemId: string | null,
): UseConsumptionReportResult {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<ConsumptionMetrics | null>(null)
  const [barData, setBarData] = useState<BarChartData[]>([])
  const [lineData, setLineData] = useState<LineChartData[]>([])
  const [items, setItems] = useState<{ id: string; name: string }[]>([])
  const [healthUnits, setHealthUnits] = useState<string[]>([])

  const startStr = dateRange.start.toISOString()
  const endStr = dateRange.end.toISOString()

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      setLoading(true)
      try {
        const [{ data: itemsData }, { data: unitsData }] = await Promise.all([
          supabase.from('items').select('id, name').order('name'),
          supabase
            .from('inventory_movements')
            .select('health_unit_name')
            .not('health_unit_name', 'is', null),
        ])

        const uniqueUnits = [
          ...new Set(unitsData?.map((d: any) => d.health_unit_name).filter(Boolean) || []),
        ]

        if (isMounted) {
          setItems(itemsData || [])
          setHealthUnits(uniqueUnits.sort())
        }

        const prevRange = getPreviousRange({ start: new Date(startStr), end: new Date(endStr) })

        let currentQuery = supabase
          .from('inventory_movements')
          .select('item_id, quantity, created_at, items(id, name)')
          .in('type', CONSUMPTION_TYPES)
          .gte('created_at', startStr)
          .lte('created_at', endStr)

        let prevQuery = supabase
          .from('inventory_movements')
          .select('item_id, quantity, items(id, name)')
          .in('type', CONSUMPTION_TYPES)
          .gte('created_at', prevRange.start.toISOString())
          .lte('created_at', prevRange.end.toISOString())

        if (healthUnit) {
          currentQuery = currentQuery.eq('health_unit_name', healthUnit)
          prevQuery = prevQuery.eq('health_unit_name', healthUnit)
        }

        const [{ data: currentMovements }, { data: prevMovements }] = await Promise.all([
          currentQuery,
          prevQuery,
        ])

        const totalConsumed =
          currentMovements?.reduce((s, m: any) => s + Number(m.quantity), 0) || 0
        const daysInPeriod = Math.max(
          1,
          Math.ceil((new Date(endStr).getTime() - new Date(startStr).getTime()) / 86400000),
        )
        const dailyAverage = totalConsumed / daysInPeriod
        const previousTotal = prevMovements?.reduce((s, m: any) => s + Number(m.quantity), 0) || 0
        const variationPercentage =
          previousTotal > 0 ? ((totalConsumed - previousTotal) / previousTotal) * 100 : 0

        const currentItemTotals = new Map<string, { name: string; total: number }>()
        currentMovements?.forEach((m: any) => {
          const name = m.items?.name?.trim() || 'Desconhecido'
          const existing = currentItemTotals.get(m.item_id) || { name, total: 0 }
          existing.total += Number(m.quantity)
          currentItemTotals.set(m.item_id, existing)
        })

        const prevItemTotals = new Map<string, number>()
        prevMovements?.forEach((m: any) => {
          prevItemTotals.set(m.item_id, (prevItemTotals.get(m.item_id) || 0) + Number(m.quantity))
        })

        let topVariationItem: { name: string; variation: number } | null = null
        currentItemTotals.forEach((value, key) => {
          const prevQty = prevItemTotals.get(key) || 0
          if (prevQty > 0) {
            const variation = ((value.total - prevQty) / prevQty) * 100
            if (!topVariationItem || Math.abs(variation) > Math.abs(topVariationItem.variation)) {
              topVariationItem = { name: value.name, variation }
            }
          }
        })

        const barChart = Array.from(currentItemTotals.values())
          .map((v) => ({ name: v.name, consumido: v.total }))
          .sort((a, b) => b.consumido - a.consumido)
          .slice(0, 10)

        let lineChart: LineChartData[] = []
        if (selectedItemId) {
          const itemMovements =
            currentMovements?.filter((m: any) => m.item_id === selectedItemId) || []
          const dailyMap = new Map<string, number>()
          itemMovements.forEach((m: any) => {
            const date = new Date(m.created_at).toISOString().split('T')[0]
            dailyMap.set(date, (dailyMap.get(date) || 0) + Number(m.quantity))
          })
          lineChart = Array.from(dailyMap.entries())
            .map(([date, quantity]) => ({ date, quantity }))
            .sort((a, b) => a.date.localeCompare(b.date))
        }

        if (isMounted) {
          setMetrics({
            totalConsumed,
            dailyAverage,
            totalItems: currentItemTotals.size,
            previousTotal,
            variationPercentage,
            topVariationItem,
          })
          setBarData(barChart)
          setLineData(lineChart)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    return () => {
      isMounted = false
    }
  }, [startStr, endStr, healthUnit, selectedItemId])

  return { loading, metrics, barData, lineData, items, healthUnits }
}
