import { useMemo } from 'react'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useInventoryStore } from '@/stores/useInventoryStore'

export function DashboardChart() {
  const { movements } = useInventoryStore()

  const data = useMemo(() => {
    const numWeeks = 13
    const weeks = Array.from({ length: numWeeks }, (_, i) => {
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() - i * 7)
      weekEnd.setHours(23, 59, 59, 999)
      const weekStart = new Date(weekEnd)
      weekStart.setDate(weekStart.getDate() - 6)
      weekStart.setHours(0, 0, 0, 0)
      return { start: weekStart, end: weekEnd }
    }).reverse()

    return weeks.map(({ start, end }) => {
      const formatted = start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      const totalOut = movements
        .filter((m) => {
          if (m.type !== 'OUT') return false
          const d = new Date(m.created_at || 0)
          return d >= start && d <= end
        })
        .reduce((sum, m) => sum + Number(m.quantity), 0)

      return { date: formatted, saidas: totalOut }
    })
  }, [movements])

  const chartConfig = {
    saidas: {
      label: 'Unidades Distribuídas',
      color: 'hsl(var(--primary))',
    },
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">Consumo (Últimos 90 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="saidas" fill="var(--color-saidas)" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
