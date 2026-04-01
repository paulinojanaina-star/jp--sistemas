import { useState } from 'react'
import { useTeamStore } from '@/stores/useTeamStore'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SmartTimeOffCard } from './SmartTimeOffCard'

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

  return (
    <Card className="flex flex-col h-full border-border/50 shadow-sm animate-fade-in-up">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-base">Todas as Escalas Programadas</CardTitle>
        <CardDescription>
          Visão geral de todas as ausências futuras em ordem cronológica
        </CardDescription>
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
          <div className="grid grid-cols-1 gap-3">
            {upcomingRequests.map((req) => (
              <SmartTimeOffCard
                key={req.id}
                req={req}
                onEdit={() => onEdit(req.id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
