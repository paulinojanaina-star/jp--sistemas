import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, TrendingDown } from 'lucide-react'
import { StaleItemsReport } from '@/components/reports/StaleItemsReport'
import { ConsumptionReport } from '@/components/reports/ConsumptionReport'

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Relatórios Gerenciais</h2>
        <p className="text-muted-foreground">
          Gere análises e visualize o consumo médio e o status do estoque.
        </p>
      </div>

      <Tabs defaultValue="consumption" className="space-y-4">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
          <TabsTrigger value="consumption" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            <span className="hidden sm:inline">Consumo Médio</span>
            <span className="sm:hidden">Consumo</span>
          </TabsTrigger>
          <TabsTrigger value="stale" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Sem Movimentação</span>
            <span className="sm:hidden">Inativos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consumption" className="space-y-4">
          <ConsumptionReport />
        </TabsContent>

        <TabsContent value="stale" className="space-y-4">
          <StaleItemsReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}
