import { useState } from 'react'
import { useTeamStore } from '@/stores/useTeamStore'
import { Input } from '@/components/ui/input'
import { Search, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TimeOffRequest } from '@/types/team'

export function TimeOffList({ onEdit }: { onEdit: (id: string) => void }) {
  const { timeOffRequests, deleteTimeOff } = useTeamStore()
  const [searchTerm, setSearchTerm] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]

  const upcomingRequests = timeOffRequests
    .filter((r) => r.start_date >= todayStr)
    .filter((r) =>
      searchTerm ? r.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase()) : true,
    )
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de ausência?')) {
      await deleteTimeOff(id)
    }
  }

  const formatDateBR = (dateStr: string) => {
    const parts = dateStr.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return dateStr
  }

  const getBadgeStyle = (type: string) => {
    if (type === 'FERIAS') return 'bg-amber-500 hover:bg-amber-600 text-white border-transparent'
    if (type === 'ATESTADO') return 'bg-rose-500 hover:bg-rose-600 text-white border-transparent'
    if (type === 'FERIADO')
      return 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent'
    return 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100'
  }

  const renderRequest = (req: TimeOffRequest) => {
    const isActive = req.start_date <= todayStr && req.end_date >= todayStr
    const isSystem = req.id.startsWith('auto-')
    return (
      <div
        key={req.id}
        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg shadow-sm transition-colors hover:bg-muted/50 ${isActive ? 'bg-muted/30 border-primary/20' : 'bg-card'}`}
      >
        <div className="mb-2 sm:mb-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{req.employees?.name}</span>
            <Badge
              variant={req.type === 'FOLGA' ? 'outline' : 'default'}
              className={`${getBadgeStyle(req.type)} text-[10px] px-1.5 py-0`}
            >
              {req.type}
            </Badge>
            {isActive && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 hover:bg-green-200 border-transparent text-[10px] px-1.5 py-0"
              >
                Ativo
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            {formatDateBR(req.start_date)} até {formatDateBR(req.end_date)}
            <span className="text-[10px] opacity-70">({req.employees?.category})</span>
          </p>
          {req.notes && (
            <p className="text-[10px] text-muted-foreground mt-0.5 italic line-clamp-1">
              "{req.notes}"
            </p>
          )}
        </div>
        {!isSystem && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(req.id)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(req.id)}
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="flex flex-col h-full border-border/50 shadow-sm animate-fade-in-up">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-base">Todas as Escalas Programadas</CardTitle>
        <CardDescription>Visão geral de todas as ausências futuras</CardDescription>
        <div className="mt-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por colaborador..."
            className="pl-9 bg-muted/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 flex-1 max-h-[600px] overflow-y-auto">
        {upcomingRequests.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center border rounded-lg border-dashed">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground">Nenhuma escala futura encontrada</p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchTerm
                ? 'Tente buscar por outro nome'
                : 'Não há ausências programadas a partir de hoje'}
            </p>
          </div>
        ) : (
          upcomingRequests.map(renderRequest)
        )}
      </CardContent>
    </Card>
  )
}
