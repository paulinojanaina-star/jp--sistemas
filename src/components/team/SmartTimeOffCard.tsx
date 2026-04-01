import { TimeOffRequest } from '@/types/team'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, Edit, Trash2 } from 'lucide-react'

interface Props {
  req: TimeOffRequest
  onEdit?: (req: TimeOffRequest) => void
  onDelete?: (id: string) => void
}

export function SmartTimeOffCard({ req, onEdit, onDelete }: Props) {
  const todayStr = new Date().toISOString().split('T')[0]
  const isActive = req.start_date <= todayStr && req.end_date >= todayStr
  const isSystem = req.id.startsWith('auto-')

  const formatDateBR = (dateStr: string) => {
    const parts = dateStr.split('-')
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr
  }

  const getDaysCount = (start: string, end: string) => {
    const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const getBadgeStyle = (type: string) => {
    if (type === 'FERIAS') return 'bg-amber-500 hover:bg-amber-600 text-white'
    if (type === 'ATESTADO') return 'bg-rose-500 hover:bg-rose-600 text-white'
    if (type === 'FERIADO') return 'bg-emerald-500 hover:bg-emerald-600 text-white'
    return 'bg-blue-500 hover:bg-blue-600 text-white'
  }

  return (
    <div
      className={`group relative overflow-hidden flex flex-col p-4 border rounded-xl shadow-sm transition-all hover:shadow-md ${isActive ? 'bg-primary/5 border-primary/20' : 'bg-card hover:border-primary/30'}`}
    >
      {isActive && <div className="absolute top-0 left-0 w-1 h-full bg-primary" />}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-sm flex items-center gap-2">
            {req.employees?.name}
            {isActive && (
              <span
                className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"
                title="Ativo hoje"
              />
            )}
          </h4>
          <p className="text-xs text-muted-foreground">{req.employees?.category}</p>
        </div>
        <Badge
          variant="default"
          className={`${getBadgeStyle(req.type)} text-[10px] px-2 py-0.5 uppercase tracking-wider font-semibold border-0`}
        >
          {req.type}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-xs text-foreground/80 bg-muted/50 p-2 rounded-md mb-2">
        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <span>
          {formatDateBR(req.start_date)}
          {req.start_date !== req.end_date && ` - ${formatDateBR(req.end_date)}`}
        </span>
        {getDaysCount(req.start_date, req.end_date) > 1 && (
          <span className="ml-auto font-medium text-muted-foreground">
            {getDaysCount(req.start_date, req.end_date)} dias
          </span>
        )}
      </div>

      {req.notes && (
        <p className="text-xs text-muted-foreground italic line-clamp-2 mt-1">"{req.notes}"</p>
      )}

      {!isSystem && (onEdit || onDelete) && (
        <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-background/50"
              onClick={() => onEdit(req)}
            >
              <Edit className="h-3 w-3 mr-1" /> Editar
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(req.id)}
              className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground bg-background/50"
            >
              <Trash2 className="h-3 w-3 mr-1" /> Excluir
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
