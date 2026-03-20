import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { formatItemDisplay } from '@/utils/itemFormat'

export function ConsumptionReport() {
  const { movements, items } = useInventoryStore()

  // Calculate total consumption for the items
  const data = items
    .map((item) => {
      const consumed = movements
        .filter((m) => m.item_id === item.id && m.type === 'OUT')
        .reduce((acc, curr) => acc + Number(curr.quantity), 0)
      return { name: formatItemDisplay(item), consumido: consumed }
    })
    .sort((a, b) => b.consumido - a.consumido)
    .slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Itens Mais Consumidos (Histórico Total)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ consumido: { label: 'Quantidade Saída', color: 'hsl(var(--primary))' } }}
          className="h-[400px] w-full"
        >
          <BarChart data={data} layout="vertical" margin={{ left: 50 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis
              dataKey="name"
              type="category"
              width={150}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) =>
                value.length > 20 ? `${value.substring(0, 20)}...` : value
              }
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="consumido" fill="var(--color-consumido)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
