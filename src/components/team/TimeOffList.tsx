import { useState } from 'react'
import { useTeamStore } from '@/stores/useTeamStore'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SmartTimeOffCard } from './SmartTimeOffCard'
import { ExportButtons } from '@/components/ExportButtons'
import { GenericExportOptions } from '@/utils/exportGeneric'
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

  return (
    <Card className="flex flex-col h-full border-border/50 shadow-sm animate-fade-in-up">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-base">Todas as Escalas Programadas</CardTitle>
        <CardDescription>
          Visão geral de todas as ausências futuras em ordem cronológica
        </CardDescription>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por colaborador..."
              className="pl-9 bg-muted/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ExportButtons
            disabled={upcomingRequests.length === 0}
            options={(): GenericExportOptions<TimeOffRequest> => ({
              filename: 'escalas-programadas',
              title: 'Todas as Escalas Programadas',
              subtitle: `Total: ${upcomingRequests.length} escalas`,
              filters: [{ label: 'Busca', value: searchTerm || 'Todos' }],
              data: upcomingRequests,
              columns: [
                {
                  header: 'Profissional',
                  accessor: (r) => r.employees?.name || 'Não informado',
                },
                {
                  header: 'Função',
                  accessor: (r) => r.employees?.category || '-',
                },
                {
                  header: 'Tipo',
                  accessor: (r) => {
                    if (r.type === 'FERIAS') return 'Férias'
                    if (r.type === 'ATESTADO') return 'Atestado'
                    if (r.type === 'FOLGA') return 'Folga'
                    return r.type
                  },
                },
                {
                  header: 'Início',
                  accessor: (r) => {
                    const parts = r.start_date.split('-')
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : r.start_date
                  },
                },
                {
                  header: 'Fim',
                  accessor: (r) => {
                    const parts = r.end_date.split('-')
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : r.end_date
                  },
                },
                {
                  header: 'Dias',
                  accessor: (r) => {
                    const diffTime = Math.abs(
                      new Date(r.end_date).getTime() - new Date(r.start_date).getTime(),
                    )
                    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
                  },
                  align: 'center',
                },
                { header: 'Observações', accessor: (r) => r.notes || '-' },
              ],
            })}
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
