import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileSpreadsheet, FileText, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { exportToExcel, exportToPdf, GenericExportOptions } from '@/utils/exportGeneric'

interface ExportButtonsProps<T = any> {
  options: () => Promise<GenericExportOptions<T>> | GenericExportOptions<T>
  disabled?: boolean
  variant?: 'split' | 'menu'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  align?: 'start' | 'end'
}

export function ExportButtons<T = any>({
  options,
  disabled = false,
  variant = 'split',
  size = 'sm',
  className = '',
  align = 'end',
}: ExportButtonsProps<T>) {
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)

  const handleExport = async (format: 'excel' | 'pdf') => {
    const isExcel = format === 'excel'
    if (isExcel) setLoadingExcel(true)
    else setLoadingPdf(true)

    try {
      const opts = await options()
      if (!opts.data || opts.data.length === 0) {
        toast.info('Nenhum registro para exportar com os filtros atuais.')
        return
      }

      if (isExcel) {
        exportToExcel(opts)
        toast.success(`Exportação Excel concluída (${opts.data.length} registros).`)
      } else {
        exportToPdf(opts)
        toast.success(`Exportação PDF concluída (${opts.data.length} registros).`)
      }
    } catch (err: any) {
      console.error('Erro na exportação:', err)
      toast.error('Erro ao gerar exportação. Verifique o console.')
    } finally {
      if (isExcel) setLoadingExcel(false)
      else setLoadingPdf(false)
    }
  }

  if (variant === 'menu') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={size}
            disabled={disabled || loadingExcel || loadingPdf}
            className={`gap-1.5 shadow-sm font-semibold ${className}`}
          >
            {loadingExcel || loadingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Exportar</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-44">
          <DropdownMenuItem
            onClick={() => handleExport('excel')}
            disabled={disabled || loadingExcel}
            className="cursor-pointer gap-2"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport('pdf')}
            disabled={disabled || loadingPdf}
            className="cursor-pointer gap-2"
          >
            <FileText className="h-4 w-4 text-rose-600" />
            <span>PDF (.pdf)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Variant 'split': dois botões discretos lado a lado
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <Button
        variant="outline"
        size={size}
        onClick={() => handleExport('excel')}
        disabled={disabled || loadingExcel}
        className="gap-1.5 shadow-sm font-medium hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400"
        title="Exportar para planilha Excel (.xlsx)"
      >
        {loadingExcel ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
        )}
        <span>Excel</span>
      </Button>

      <Button
        variant="outline"
        size={size}
        onClick={() => handleExport('pdf')}
        disabled={disabled || loadingPdf}
        className="gap-1.5 shadow-sm font-medium hover:border-rose-500 hover:text-rose-700 dark:hover:text-rose-400"
        title="Exportar para documento PDF (.pdf)"
      >
        {loadingPdf ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileText className="h-3.5 w-3.5 text-rose-600" />
        )}
        <span>PDF</span>
      </Button>
    </div>
  )
}
