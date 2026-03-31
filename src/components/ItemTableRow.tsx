import { TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CalendarIcon, Files } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ItemRowActions } from '@/components/ItemRowActions'
import { formatItemDisplay } from '@/utils/itemFormat'
import { getNearestExpiry, parseDateSafe } from '@/utils/expiryLogic'
import { calculateConsumption } from '@/utils/consumptionLogic'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function ItemTableRow({
  item,
  movements,
  today,
  isDuplicate,
}: {
  item: any
  movements: any[]
  today: Date
  isDuplicate?: boolean
}) {
  const isZero = Number(item.current_quantity) === 0
  const isCritical =
    Number(item.current_quantity) > 0 && Number(item.current_quantity) <= Number(item.min_quantity)
  const percentage = Math.min(
    100,
    Math.max(0, (Number(item.current_quantity) / (Number(item.min_quantity) * 2 || 1)) * 100),
  )

  const { isStockoutRisk, daysUntilStockout, monthlyConsumption } = calculateConsumption(
    item,
    movements,
  )

  let nearest = getNearestExpiry(item, movements)
  let isExpired = false
  let isExpiringSoon = false
  let nearestExpiry = null
  let nearestBatch = null
  let isExpiring120Days = false

  if (!nearest && movements) {
    const latestInWithExpiry = movements
      .filter((m: any) => m.item_id === item.id && m.type === 'IN' && m.expiry_date)
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      )[0]

    if (latestInWithExpiry && latestInWithExpiry.expiry_date) {
      const parsedDate = parseDateSafe(latestInWithExpiry.expiry_date)
      if (parsedDate) {
        nearest = {
          date: parsedDate,
          batch: latestInWithExpiry.batch_number,
          movement_id: latestInWithExpiry.id,
        }
      }
    }
  }

  if (nearest) {
    nearestExpiry = nearest.date
    nearestBatch = nearest.batch
    if (Number(item.current_quantity) > 0) {
      const diffDays = (nearestExpiry.getTime() - today.getTime()) / (1000 * 3600 * 24)
      if (diffDays < 0) {
        isExpired = true
      } else if (diffDays <= 60) {
        isExpiringSoon = true
      } else if (diffDays <= 120) {
        isExpiring120Days = true
      }
    }
  }

  const rowHighlightClass = isZero
    ? 'bg-destructive/5 hover:bg-destructive/10'
    : isExpired
      ? 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-800'
      : isStockoutRisk
        ? 'bg-purple-500/5 hover:bg-purple-500/10'
        : isExpiringSoon || isCritical
          ? 'bg-amber-500/5 hover:bg-amber-500/10'
          : isExpiring120Days
            ? 'bg-yellow-500/5 hover:bg-yellow-500/10'
            : ''

  return (
    <TableRow className={rowHighlightClass}>
      <TableCell>
        <div className="font-medium text-foreground flex items-center gap-2 flex-wrap">
          {formatItemDisplay(item)}

          {isDuplicate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="h-5 px-1.5 border-amber-500/30 bg-amber-500/10 text-amber-600 gap-1 cursor-help hover:bg-amber-500/20"
                >
                  <Files className="h-3 w-3" />
                  <span className="text-[10px] uppercase font-semibold">Duplicado?</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Possível duplicidade detectada. Nomes muito similares no estoque.</p>
              </TooltipContent>
            </Tooltip>
          )}

          {isZero && (
            <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase font-semibold">
              Zerado
            </Badge>
          )}
          {isExpired && !isZero && (
            <Badge className="h-5 px-1.5 text-[10px] uppercase font-semibold border-transparent bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
              Vencido
            </Badge>
          )}
          {isStockoutRisk && !isZero && !isExpired && (
            <Badge className="bg-purple-500 hover:bg-purple-600 text-white h-5 px-1.5 text-[10px] uppercase border-transparent font-semibold">
              Risco de Ruptura
            </Badge>
          )}
          {isCritical && !isZero && !isExpired && !isStockoutRisk && (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white h-5 px-1.5 text-[10px] uppercase border-transparent font-semibold">
              Crítico
            </Badge>
          )}
          {isExpiringSoon && !isZero && !isExpired && !isStockoutRisk && !isCritical && (
            <Badge className="bg-orange-500 hover:bg-orange-600 text-white h-5 px-1.5 text-[10px] uppercase border-transparent font-semibold">
              Vence em ≤ 60 dias
            </Badge>
          )}
          {isExpiring120Days &&
            !isZero &&
            !isExpired &&
            !isStockoutRisk &&
            !isCritical &&
            !isExpiringSoon && (
              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white h-5 px-1.5 text-[10px] uppercase border-transparent font-semibold">
                Vence em ≤ 120 dias
              </Badge>
            )}
        </div>
        <div className="text-xs text-muted-foreground">{item.unit_type}</div>
        {item.description && (
          <div
            className="text-xs text-muted-foreground/80 mt-1.5 line-clamp-2 whitespace-normal break-words max-w-[280px]"
            title={item.description}
          >
            <span className="font-medium text-muted-foreground">Obs:</span> {item.description}
          </div>
        )}
      </TableCell>
      <TableCell>
        {nearestExpiry ? (
          <div className="flex flex-col gap-1">
            <span
              className={cn(
                'font-medium flex items-center gap-1',
                isExpired && !isZero
                  ? 'text-slate-900 dark:text-slate-100 font-bold'
                  : isExpiringSoon && !isZero
                    ? 'text-orange-600'
                    : isExpiring120Days && !isZero
                      ? 'text-yellow-600'
                      : isZero
                        ? 'text-muted-foreground/70'
                        : 'text-foreground',
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
              {format(nearestExpiry, 'dd/MM/yyyy')}
            </span>
            {nearestBatch && (
              <span className="text-xs text-muted-foreground">Lote: {nearestBatch}</span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs italic">N/A</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <span
          className={cn(
            'font-mono text-base font-medium',
            isZero && 'text-destructive font-bold',
            isStockoutRisk && !isZero && 'text-purple-600 font-bold',
            isCritical && !isZero && !isStockoutRisk && 'text-amber-600 font-bold',
          )}
        >
          {item.current_quantity}
        </span>
        <div className="text-[10px] text-muted-foreground mt-0.5" title="Média de saída mensal">
          Média: {monthlyConsumption}/mês
        </div>
        {isStockoutRisk && (
          <div className="text-[10px] text-purple-600 font-bold mt-0.5 leading-tight">
            Ruptura em ~{Math.round(daysUntilStockout)} dias
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
            <span>Min: {item.min_quantity}</span>
            <span>{percentage > 100 ? '+100' : Math.round(percentage)}%</span>
          </div>
          <Progress
            value={percentage}
            className={cn(
              'h-1.5 bg-muted',
              isZero && '[&>div]:bg-destructive',
              isStockoutRisk && !isZero && '[&>div]:bg-purple-500',
              isCritical && !isZero && !isStockoutRisk && '[&>div]:bg-amber-500',
              !isZero && !isCritical && !isStockoutRisk && '[&>div]:bg-secondary',
            )}
          />
        </div>
      </TableCell>
      <TableCell>
        <ItemRowActions item={item} />
      </TableCell>
    </TableRow>
  )
}
