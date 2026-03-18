import { useEffect, useState } from 'react'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase/client'

type ChartData = {
  name: string
  total: number
}

export function DashboardTopItemsChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      try {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: movements, error } = await supabase
          .from('inventory_movements')
          .select('quantity, items(name)')
          .eq('type', 'OUT')
          .gte('created_at', thirtyDaysAgo.toISOString())

        if (error) {
          console.error('Error fetching top items:', error)
          return
        }

        if (movements && isMounted) {
          const itemTotals = new Map<string, number>()

          movements.forEach((m) => {
            const itemName = (m.items as any)?.name || 'Desconhecido'
            itemTotals.set(itemName, (itemTotals.get(itemName) || 0) + m.quantity)
          })

          const aggregatedData = Array.from(itemTotals.entries())
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5)

          setData(aggregatedData)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  const chartConfig = {
    total: {
      label: 'Quantidade Saída',
      color: 'hsl(var(--primary))',
    },
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">Itens com Maior Saída (Últimos 30 Dias)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">
              Nenhuma saída registrada nos últimos 30 dias.
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  value.length > 15 ? `${value.substring(0, 15)}...` : value
                }
              />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
