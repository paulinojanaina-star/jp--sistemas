import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Clock,
  TrendingDown,
  TrendingUp,
  PackageSearch,
  ShoppingCart,
  ShieldCheck,
} from 'lucide-react'
import { StaleItemsReport } from '@/components/reports/StaleItemsReport'
import { ConsumptionReport } from '@/components/reports/ConsumptionReport'
import { ItemTrendReport } from '@/components/reports/ItemTrendReport'
import { StockPositionReport } from '@/components/reports/StockPositionReport'
import { PurchaseSuggestionReport } from '@/components/reports/PurchaseSuggestionReport'

export default function Reports() {
  return (
    <div className="space-y-8 animate-fade-in-up pb-8">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-[2rem] border border-border/50 shadow-2xl mb-8 flex flex-col justify-center min-h-[240px]">
        <div
          className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity"
          style={{
            backgroundImage:
              'url("https://img.usecurling.com/p/1920/600?q=data%20analytics%20abstract%20modern%20medical&color=blue&dpr=2")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/40 z-0" />

        <div className="relative z-10 p-8 lg:p-12 flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-black uppercase tracking-widest w-fit backdrop-blur-md shadow-inner">
            <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
            Business Intelligence
          </div>
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-white drop-shadow-lg">
            Analytics & Relatórios
          </h1>
          <p className="text-lg lg:text-xl text-slate-300 max-w-2xl font-bold drop-shadow-md">
            Obtenha insights corporativos profundos, antecipe demandas críticas e embase decisões em
            dados consolidados de alta precisão.
          </p>
        </div>
      </div>

      <Tabs defaultValue="stock" className="space-y-8">
        <div className="bg-card/80 backdrop-blur-xl rounded-[1.5rem] p-2 border border-border/50 shadow-lg inline-flex w-full overflow-x-auto overflow-y-hidden hide-scrollbar">
          <TabsList className="grid w-full lg:w-auto grid-cols-5 h-auto bg-transparent gap-2">
            <TabsTrigger
              value="stock"
              className="gap-2 text-sm py-3.5 px-5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all font-extrabold"
            >
              <PackageSearch className="h-5 w-5" />
              <span className="hidden sm:inline">Posição Atual</span>
              <span className="sm:hidden">Posição</span>
            </TabsTrigger>
            <TabsTrigger
              value="consumption"
              className="gap-2 text-sm py-3.5 px-5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all font-extrabold"
            >
              <TrendingDown className="h-5 w-5" />
              <span className="hidden sm:inline">Consumo</span>
              <span className="sm:hidden">Consumo</span>
            </TabsTrigger>
            <TabsTrigger
              value="purchase"
              className="gap-2 text-sm py-3.5 px-5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all font-extrabold"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Compras</span>
              <span className="sm:hidden">Compras</span>
            </TabsTrigger>
            <TabsTrigger
              value="trends"
              className="gap-2 text-sm py-3.5 px-5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all font-extrabold"
            >
              <TrendingUp className="h-5 w-5" />
              <span className="hidden sm:inline">Tendências</span>
              <span className="sm:hidden">Trends</span>
            </TabsTrigger>
            <TabsTrigger
              value="stale"
              className="gap-2 text-sm py-3.5 px-5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all font-extrabold"
            >
              <Clock className="h-5 w-5" />
              <span className="hidden sm:inline">Inativos</span>
              <span className="sm:hidden">Inativos</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="bg-card/90 backdrop-blur-2xl border border-border/50 shadow-2xl rounded-[2rem] p-6 lg:p-10 min-h-[500px]">
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
