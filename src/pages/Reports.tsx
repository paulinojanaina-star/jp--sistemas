import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, TrendingDown, TrendingUp, PackageSearch, ShoppingCart } from 'lucide-react'
import { StaleItemsReport } from '@/components/reports/StaleItemsReport'
import { ConsumptionReport } from '@/components/reports/ConsumptionReport'
import { ItemTrendReport } from '@/components/reports/ItemTrendReport'
import { StockPositionReport } from '@/components/reports/StockPositionReport'
import { PurchaseSuggestionReport } from '@/components/reports/PurchaseSuggestionReport'

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Relatórios Gerenciais</h2>
        <p className="text-muted-foreground">
          Gere análises, exporte posições de estoque e visualize o consumo médio.
        </p>
      </div>

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList className="grid w-full xl:w-[1000px] grid-cols-5 h-auto min-h-10">
          <TabsTrigger value="stock" className="gap-2 text-xs sm:text-sm py-2">
            <PackageSearch className="h-4 w-4 hidden sm:block" />
            <span className="hidden sm:inline">Posição Atual</span>
            <span className="sm:hidden">Posição</span>
          </TabsTrigger>
          <TabsTrigger value="consumption" className="gap-2 text-xs sm:text-sm py-2">
            <TrendingDown className="h-4 w-4 hidden sm:block" />
            <span className="hidden sm:inline">Consumo Médio</span>
            <span className="sm:hidden">Consumo</span>
          </TabsTrigger>
          <TabsTrigger value="purchase" className="gap-2 text-xs sm:text-sm py-2">
            <ShoppingCart className="h-4 w-4 hidden sm:block" />
            <span className="hidden sm:inline">Sugestão de Compra</span>
            <span className="sm:hidden">Compras</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2 text-xs sm:text-sm py-2">
            <TrendingUp className="h-4 w-4 hidden sm:block" />
            <span className="hidden sm:inline">Tendências</span>
            <span className="sm:hidden">Tendência</span>
          </TabsTrigger>
          <TabsTrigger value="stale" className="gap-2 text-xs sm:text-sm py-2">
            <Clock className="h-4 w-4 hidden sm:block" />
            <span className="hidden sm:inline">Sem Movimentação</span>
            <span className="sm:hidden">Inativos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <StockPositionReport />
        </TabsContent>

        <TabsContent value="consumption" className="space-y-4">
          <ConsumptionReport />
        </TabsContent>

        <TabsContent value="purchase" className="space-y-4">
          <PurchaseSuggestionReport />
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <ItemTrendReport />
        </TabsContent>

        <TabsContent value="stale" className="space-y-4">
          <StaleItemsReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}
