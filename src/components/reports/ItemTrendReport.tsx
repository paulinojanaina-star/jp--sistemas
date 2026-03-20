import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

export function ItemTrendReport() {
  const { movements } = useInventoryStore()

  const data = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return d
  })
    .reverse()
    .map((date) => {
      const month = date.getMonth()
      const year = date.getFullYear()
      const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

      const outs = movements
        .filter((m) => {
          const md = new Date(m.created_at)
          return md.getMonth() === month && md.getFullYear() === year && m.type === 'OUT'
        })
        .reduce((acc, curr) => acc + Number(curr.quantity), 0)

      const ins = movements
        .filter((m) => {
          const md = new Date(m.created_at)
          return md.getMonth() === month && md.getFullYear() === year && m.type === 'IN'
        })
        .reduce((acc, curr) => acc + Number(curr.quantity), 0)

      return { name: label, entradas: ins, saidas: outs }
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Movimentações (Últimos 6 meses)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            entradas: { label: 'Entradas', color: 'hsl(var(--secondary))' },
            saidas: { label: 'Saídas', color: 'hsl(var(--primary))' },
          }}
          className="h-[400px] w-full"
        >
          <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="entradas"
              stroke="var(--color-entradas)"
              strokeWidth={2}
            />
            <Line type="monotone" dataKey="saidas" stroke="var(--color-saidas)" strokeWidth={2} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
