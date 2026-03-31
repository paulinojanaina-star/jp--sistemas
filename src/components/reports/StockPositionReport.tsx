import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileDown, FileSpreadsheet, PackageSearch, AlertTriangle, AlertCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { exportStockReportPdf, exportStockReportExcel, ReportFilter } from '@/utils/exportPdf'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'

export function StockPositionReport() {
  const [filter, setFilter] = useState<ReportFilter>('all')
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [stats, setStats] = useState({ total: 0, critical: 0, zero: 0, expiring: 0, expired: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      const { data: items } = await supabase.from('items').select('*')
      const { data: movements } = await supabase.from('inventory_movements').select('*')

      if (!items) return

      let criticalCount = 0
      let zeroCount = 0
      let expiringCount = 0
      let expiredCount = 0

      const now = new Date()
      const days120 = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000)

      items.forEach((item) => {
        const qty = item.current_quantity ?? 0
        const min = item.min_quantity ?? 0

        if (qty <= 0) zeroCount++
        else if (qty <= min) criticalCount++

        if (movements && qty > 0) {
          const itemMovements = movements
            .filter((m) => m.item_id === item.id && m.type === 'IN')
            .sort(
              (a, b) =>
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
            )

          let remainingStock = qty
          let nearestExpiry: Date | null = null

          for (const m of itemMovements) {
            if (remainingStock <= 0) break
            if (m.expiry_date) {
              const d = new Date(m.expiry_date)
              if (!nearestExpiry || d < nearestExpiry) {
                nearestExpiry = d
              }
            }
            remainingStock -= Number(m.quantity) || 0
          }

          if (nearestExpiry) {
            if (nearestExpiry <= now) expiredCount++
            else if (nearestExpiry <= days120) expiringCount++
          }
        }
      })

      setStats({
        total: items.length,
        critical: criticalCount,
        zero: zeroCount,
        expiring: expiringCount,
        expired: expiredCount,
      })
    }

    fetchStats()
  }, [])

  const handleExportPdf = async () => {
    setIsExportingPdf(true)
    try {
      const { error } = await exportStockReportPdf(filter)
      if (error) throw error
      toast.success('Relatório PDF gerado com sucesso')
    } catch (error) {
      toast.error('Erro ao gerar relatório')
    } finally {
      setIsExportingPdf(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    try {
      const { error } = await exportStockReportExcel(filter)
      if (error) throw error
      toast.success('Relatório Excel exportado com sucesso')
    } catch (error) {
      toast.error('Erro ao exportar relatório')
    } finally {
      setIsExportingExcel(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Itens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Estoque Crítico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.critical}</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />A Vencer (120d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expiring}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Vencidos / Zerados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.expired} / {stats.zero}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-primary" />
            Exportar Posição de Estoque
          </CardTitle>
          <CardDescription>
            Selecione o filtro desejado e baixe a relação de itens em PDF ou Excel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1 w-full">
              <label className="text-sm font-medium">Filtro de Relatório</label>
              <Select value={filter} onValueChange={(val) => setFilter(val as ReportFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um filtro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os itens</SelectItem>
                  <SelectItem value="critical">Estoque Crítico (Abaixo do mínimo)</SelectItem>
                  <SelectItem value="zero">Estoque Zerado</SelectItem>
                  <SelectItem value="expiring">Itens a Vencer (Próximos 120 dias)</SelectItem>
                  <SelectItem value="expired">Itens Vencidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none hover:bg-primary/5 hover:text-primary transition-colors"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {isExportingPdf ? 'Gerando...' : 'Exportar PDF'}
              </Button>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none hover:bg-green-600/5 hover:text-green-600 transition-colors"
                onClick={handleExportExcel}
                disabled={isExportingExcel}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {isExportingExcel ? 'Exportando...' : 'Exportar Excel'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
