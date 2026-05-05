import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DollarSign, TrendingUp, AlertTriangle, Layers, Loader2 } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

export function FinancialInsightsReport() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true)
      const { data } = await supabase.from('items').select('*')
      setItems(data || [])
      setLoading(false)
    }
    fetchDados()
  }, [])

  const insights = useMemo(() => {
    if (!items.length) return null

    const validItems = items
      .filter((i) => (i.current_quantity || 0) > 0 && (i.unit_price || 0) > 0)
      .map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.current_quantity || 0,
        price: i.unit_price || 0,
        value: (i.current_quantity || 0) * (i.unit_price || 0),
      }))
      .sort((a, b) => b.value - a.value)

    const totalValue = validItems.reduce((acc, i) => acc + i.value, 0)
    const avgValue = validItems.length ? totalValue / validItems.length : 0

    let cumValue = 0
    const abcItems = validItems.map((i) => {
      cumValue += i.value
      const cumPct = totalValue > 0 ? cumValue / totalValue : 0
      let cls = 'C'
      if (cumPct <= 0.8) cls = 'A'
      else if (cumPct <= 0.95) cls = 'B'
      return { ...i, class: cls }
    })

    const classA = abcItems.filter((i) => i.class === 'A')
    const classB = abcItems.filter((i) => i.class === 'B')
    const classC = abcItems.filter((i) => i.class === 'C')

    const pieData = [
      {
        class: 'A',
        value: classA.reduce((a, b) => a + b.value, 0),
        count: classA.length,
        fill: 'var(--color-A)',
      },
      {
        class: 'B',
        value: classB.reduce((a, b) => a + b.value, 0),
        count: classB.length,
        fill: 'var(--color-B)',
      },
      {
        class: 'C',
        value: classC.reduce((a, b) => a + b.value, 0),
        count: classC.length,
        fill: 'var(--color-C)',
      },
    ]

    const topItems = abcItems.slice(0, 5)

    const missingPriceItems = items.filter(
      (i) => (i.current_quantity || 0) > 0 && (!i.unit_price || i.unit_price <= 0),
    ).length

    return {
      totalValue,
      avgValue,
      validItemsCount: validItems.length,
      pieData,
      topItems,
      missingPriceItems,
    }
  }, [items])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!insights) return null

  const chartConfig = {
    A: { label: 'Classe A (80%)', color: 'hsl(var(--chart-1))' },
    B: { label: 'Classe B (15%)', color: 'hsl(var(--chart-2))' },
    C: { label: 'Classe C (5%)', color: 'hsl(var(--chart-3))' },
  }

  const barChartConfig = {
    value: { label: 'Valor', color: 'hsl(var(--primary))' },
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Capital Imobilizado</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(insights.totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total investido no estoque</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio por Item</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(insights.avgValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Média de valor dos itens</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Itens Precificados</CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.validItemsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Produtos valorizados no sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm border-orange-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-500">Sem Precificação</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{insights.missingPriceItems}</div>
            <p className="text-xs text-orange-500/80 mt-1">Requer atenção em Saúde dos Dados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Curva ABC Financeira</CardTitle>
            <CardDescription>Representatividade de valor: A (80%), B (15%), C (5%)</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={(v: any) => formatCurrency(Number(v))} />
                  }
                />
                <Pie
                  data={insights.pieData}
                  dataKey="value"
                  nameKey="class"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                >
                  {insights.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} className="flex-wrap" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Top 5 Maior Capital Imobilizado</CardTitle>
            <CardDescription>Itens que concentram o maior investimento</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ChartContainer config={barChartConfig} className="w-full h-[300px]">
              <BarChart
                data={insights.topItems}
                layout="vertical"
                margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                <ChartTooltip
                  cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(v: any) => formatCurrency(Number(v))}
                    />
                  }
                />
                <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
