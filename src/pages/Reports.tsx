import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Clock,
  TrendingDown,
  TrendingUp,
  PackageSearch,
  ShoppingCart,
  Sparkles,
} from 'lucide-react'
import { StaleItemsReport } from '@/components/reports/StaleItemsReport'
import { ConsumptionReport } from '@/components/reports/ConsumptionReport'
import { ItemTrendReport } from '@/components/reports/ItemTrendReport'
import { StockPositionReport } from '@/components/reports/StockPositionReport'
import { PurchaseSuggestionReport } from '@/components/reports/PurchaseSuggestionReport'

export default function Reports() {
  return (
    <div className="space-y-8 pb-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card to-muted/30 p-8 sm:p-10 border border-border/50 shadow-sm">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 text-primary/5">
          <Sparkles className="h-64 w-64" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-widest mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Analytics
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Relatórios Gerenciais
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed font-medium">
            Obtenha insights profundos sobre o seu estoque, antecipe demandas e tome decisões
            baseadas em dados consolidados.
          </p>
        </div>
      </div>

      <Tabs defaultValue="stock" className="space-y-6">
        <div className="bg-card rounded-2xl p-1.5 border border-border/50 shadow-sm inline-flex w-full overflow-x-auto overflow-y-hidden hide-scrollbar">
          <TabsList className="grid w-full lg:w-auto grid-cols-5 h-auto bg-transparent gap-1">
            <TabsTrigger
              value="stock"
              className="gap-2 text-sm py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <PackageSearch className="h-4 w-4" />
              <span className="hidden sm:inline font-bold">Posição Atual</span>
              <span className="sm:hidden font-bold">Posição</span>
            </TabsTrigger>
            <TabsTrigger
              value="consumption"
              className="gap-2 text-sm py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <TrendingDown className="h-4 w-4" />
              <span className="hidden sm:inline font-bold">Consumo</span>
              <span className="sm:hidden font-bold">Consumo</span>
            </TabsTrigger>
            <TabsTrigger
              value="purchase"
              className="gap-2 text-sm py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline font-bold">Compras</span>
              <span className="sm:hidden font-bold">Compras</span>
            </TabsTrigger>
            <TabsTrigger
              value="trends"
              className="gap-2 text-sm py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline font-bold">Tendências</span>
              <span className="sm:hidden font-bold">Trends</span>
            </TabsTrigger>
            <TabsTrigger
              value="stale"
              className="gap-2 text-sm py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline font-bold">Inativos</span>
              <span className="sm:hidden font-bold">Inativos</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="bg-card border border-border/50 shadow-subtle rounded-3xl p-6 lg:p-8 min-h-[400px]">
          <TabsContent
            value="stock"
            className="mt-0 outline-none animate-in fade-in-50 duration-500 slide-in-from-bottom-4"
          >
            <StockPositionReport />
          </TabsContent>
          <TabsContent
            value="consumption"
            className="mt-0 outline-none animate-in fade-in-50 duration-500 slide-in-from-bottom-4"
          >
            <ConsumptionReport />
          </TabsContent>
          <TabsContent
            value="purchase"
            className="mt-0 outline-none animate-in fade-in-50 duration-500 slide-in-from-bottom-4"
          >
            <PurchaseSuggestionReport />
          </TabsContent>
          <TabsContent
            value="trends"
            className="mt-0 outline-none animate-in fade-in-50 duration-500 slide-in-from-bottom-4"
          >
            <ItemTrendReport />
          </TabsContent>
          <TabsContent
            value="stale"
            className="mt-0 outline-none animate-in fade-in-50 duration-500 slide-in-from-bottom-4"
          >
            <StaleItemsReport />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
