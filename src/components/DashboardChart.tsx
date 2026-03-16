import { useMemo } from 'react'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useInventoryStore } from '@/stores/useInventoryStore'

export function DashboardChart() {
  const { movements } = useInventoryStore()

  const data = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d.toISOString().split('T')[0]
    }).reverse()

    return days.map((dayStr) => {
      const dateObj = new Date(dayStr + 'T00:00:00')
      const formatted = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      const totalOut = movements
        .filter((m) => m.type === 'SAIDA' && m.date === dayStr)
        .reduce((sum, m) => sum + m.quantity, 0)

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
        <CardTitle className="text-lg">Consumo (Últimos 7 dias)</CardTitle>
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
