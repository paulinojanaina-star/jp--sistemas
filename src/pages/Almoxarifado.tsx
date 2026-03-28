import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ArrowRightLeft, AlertTriangle, TrendingUp, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function Almoxarifado() {
  const { items = [], movements = [] } = useInventoryStore() as any

  const lowStockItems = items.filter(
    (item: any) => (item.current_quantity || 0) <= (item.min_quantity || 0),
  )
  const totalItems = items.length
  const totalMovements = movements.length

  return (
    <div className="space-y-8 animate-fade-in-up pb-8">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-[2rem] border border-border/50 shadow-2xl mb-8 flex flex-col justify-center min-h-[240px]">
        <div
          className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity"
          style={{
            backgroundImage:
              'url("https://img.usecurling.com/p/1920/600?q=modern%20warehouse%20clean%20medical&color=blue&dpr=2")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/40 z-0" />

        <div className="relative z-10 p-8 lg:p-12 flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-black uppercase tracking-widest w-fit backdrop-blur-md shadow-inner">
            <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
            Módulo Autorizado
          </div>
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-white drop-shadow-lg">
            Gestão de Suprimentos
          </h1>
          <p className="text-lg lg:text-xl text-slate-300 max-w-2xl font-bold drop-shadow-md">
            Visão executiva do controle de estoque, alertas de reposição automatizados e
            monitoramento corporativo de movimentações.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Total de Insumos',
            value: totalItems,
            desc: 'Cadastrados no sistema',
            icon: Package,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20',
          },
          {
            title: 'Atenção Crítica',
            value: lowStockItems.length,
            desc: 'Abaixo do estoque mínimo',
            icon: AlertTriangle,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20',
            valueColor: 'text-rose-600 dark:text-rose-400',
          },
          {
            title: 'Movimentações',
            value: totalMovements,
            desc: 'Registros auditados',
            icon: ArrowRightLeft,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20',
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="rounded-[1.5rem] border-border/50 shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden group bg-card/80 backdrop-blur-xl"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6">
              <CardTitle className="text-sm font-extrabold text-muted-foreground uppercase tracking-widest">
                {stat.title}
              </CardTitle>
              <div
                className={cn(
                  'p-3 rounded-2xl transition-transform duration-500 group-hover:scale-110 shadow-inner',
                  stat.bg,
                )}
              >
                <stat.icon className={cn('h-6 w-6', stat.color)} strokeWidth={2} />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div
                className={cn(
                  'text-5xl font-black tracking-tighter drop-shadow-sm',
                  stat.valueColor || 'text-foreground',
                )}
              >
                {stat.value}
              </div>
              <p className="text-sm text-muted-foreground font-bold mt-2 flex items-center gap-1">
                {stat.desc}
              </p>
            </CardContent>
          </Card>
        ))}

        <Card className="rounded-[1.5rem] border-border/50 shadow-lg hover:shadow-xl transition-all duration-500 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 backdrop-blur-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('https://img.usecurling.com/p/400/400?q=abstract%20mesh%20blue')] opacity-5 mix-blend-overlay z-0" />
          <div className="relative z-10">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6">
              <CardTitle className="text-sm font-extrabold text-primary uppercase tracking-widest">
                Ações Operacionais
              </CardTitle>
              <div className="bg-primary/20 p-3 rounded-2xl text-primary border border-primary/30 shadow-inner">
                <TrendingUp className="h-6 w-6" strokeWidth={2} />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-6 pb-6 pt-4">
              <Link
                to="/itens"
                className="flex items-center justify-between p-4 rounded-[1rem] bg-card hover:bg-primary hover:text-primary-foreground border border-border/40 shadow-md transition-all duration-300 group font-extrabold text-sm"
              >
                Catálogo de Insumos
                <ArrowRightLeft
                  className="h-5 w-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                  strokeWidth={2.5}
                />
              </Link>
              <Link
                to="/movimentacoes"
                className="flex items-center justify-between p-4 rounded-[1rem] bg-card hover:bg-primary hover:text-primary-foreground border border-border/40 shadow-md transition-all duration-300 group font-extrabold text-sm"
              >
                Nova Movimentação
                <ArrowRightLeft
                  className="h-5 w-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                  strokeWidth={2.5}
                />
              </Link>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  )
}
