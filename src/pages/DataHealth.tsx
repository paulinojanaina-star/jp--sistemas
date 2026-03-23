import { useState, useMemo } from 'react'
import { useInventoryStore } from '@/stores/useInventoryStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MergeItemModal } from '@/components/MergeItemModal'
import { ItemFormModal } from '@/components/ItemFormModal'
import { formatItemDisplay } from '@/utils/itemFormat'
import { getDuplicateGroups } from '@/utils/duplicateLogic'
import { getNearestExpiry } from '@/utils/expiryLogic'
import {
  Activity,
  Copy,
  Building2,
  Merge,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  CalendarOff,
} from 'lucide-react'
import { Item } from '@/types/inventory'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const EmptyState = ({ msg }: { msg: string }) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center h-40 text-center">
      <CheckCircle2 className="h-8 w-8 text-green-500 mb-3 opacity-80" />
      <p className="font-medium text-foreground">Excelente!</p>
      <p className="text-sm text-muted-foreground">{msg}</p>
    </CardContent>
  </Card>
)

export default function DataHealth() {
  const { items, movements } = useInventoryStore()

  const duplicateGroups = useMemo(() => getDuplicateGroups(items), [items])
  const itemsWithoutSupplier = useMemo(
    () => items.filter((i) => !i.supplier || i.supplier.trim() === ''),
    [items],
  )
  const itemsWithoutExpiry = useMemo(
    () => items.filter((i) => Number(i.current_quantity) > 0 && !getNearestExpiry(i, movements)),
    [items, movements],
  )

  const [mergeItem, setMergeItem] = useState<Item | null>(null)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Saúde dos Dados
        </h2>
        <p className="text-muted-foreground">
          Diagnóstico e auditoria do seu inventário. Corrija inconsistências para melhorar o
          planejamento.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card
          className={
            duplicateGroups.length > 0
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-green-500/30 bg-green-500/5'
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Duplicados</CardTitle>
            {duplicateGroups.length > 0 ? (
              <Copy className="h-4 w-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${duplicateGroups.length > 0 ? 'text-amber-600' : 'text-green-600'}`}
            >
              {duplicateGroups.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Grupos de itens similares</p>
          </CardContent>
        </Card>

        <Card
          className={
            itemsWithoutSupplier.length > 0
              ? 'border-blue-500/30 bg-blue-500/5'
              : 'border-green-500/30 bg-green-500/5'
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Fornecedor</CardTitle>
            {itemsWithoutSupplier.length > 0 ? (
              <Building2 className="h-4 w-4 text-blue-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${itemsWithoutSupplier.length > 0 ? 'text-blue-600' : 'text-green-600'}`}
            >
              {itemsWithoutSupplier.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requerem atualização cadastral</p>
          </CardContent>
        </Card>

        <Card
          className={
            itemsWithoutExpiry.length > 0
              ? 'border-purple-500/30 bg-purple-500/5'
              : 'border-green-500/30 bg-green-500/5'
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Validade</CardTitle>
            {itemsWithoutExpiry.length > 0 ? (
              <CalendarOff className="h-4 w-4 text-purple-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${itemsWithoutExpiry.length > 0 ? 'text-purple-600' : 'text-green-600'}`}
            >
              {itemsWithoutExpiry.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Itens em estoque sem data</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="duplicates" className="space-y-4">
        <TabsList className="grid w-full sm:max-w-2xl grid-cols-1 sm:grid-cols-3 h-auto gap-1">
          <TabsTrigger value="duplicates" className="gap-2">
            <Copy className="h-4 w-4" /> Duplicatas
            <Badge variant="secondary" className="ml-1 rounded-full h-5 px-1.5">
              {duplicateGroups.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Building2 className="h-4 w-4" /> Sem Fornecedor
            <Badge variant="secondary" className="ml-1 rounded-full h-5 px-1.5">
              {itemsWithoutSupplier.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="expiry" className="gap-2">
            <CalendarOff className="h-4 w-4" /> Sem Validade
            <Badge variant="secondary" className="ml-1 rounded-full h-5 px-1.5">
              {itemsWithoutExpiry.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="duplicates" className="space-y-4">
          {duplicateGroups.length === 0 ? (
            <EmptyState msg="Nenhum item duplicado encontrado na sua base de dados." />
          ) : (
            <div className="space-y-6">
              {duplicateGroups.map((group, idx) => (
                <Card key={idx} className="overflow-hidden">
                  <CardHeader className="py-3 bg-muted/50 border-b">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Grupo {idx + 1}:{' '}
                      <span className="font-semibold">{formatItemDisplay(group[0])}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20">
                          <TableHead>Nome</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead className="text-right">Estoque</TableHead>
                          <TableHead className="w-[120px] text-center">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.unit_type}</TableCell>
                            <TableCell className="text-right font-mono">
                              {item.current_quantity}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMergeItem(item)}
                                className="w-full"
                              >
                                <Merge className="h-3 w-3 mr-2" /> Mesclar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          {itemsWithoutSupplier.length === 0 ? (
            <EmptyState msg="Todos os seus itens possuem fornecedor vinculado." />
          ) : (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Item</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead className="w-[120px] text-center">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsWithoutSupplier.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{formatItemDisplay(item)}</TableCell>
                        <TableCell>{item.unit_type}</TableCell>
                        <TableCell className="text-right font-mono">
                          {item.current_quantity}
                        </TableCell>
                        <TableCell className="text-center">
                          <ItemFormModal
                            item={item}
                            trigger={
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Edit2 className="h-3 w-3 mr-2" /> Vincular
                              </Button>
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expiry" className="space-y-4">
          {itemsWithoutExpiry.length === 0 ? (
            <EmptyState msg="Todos os itens em estoque possuem data de validade registrada." />
          ) : (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Item</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead className="w-[120px] text-center">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsWithoutExpiry.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{formatItemDisplay(item)}</TableCell>
                        <TableCell>{item.unit_type}</TableCell>
                        <TableCell className="text-right font-mono">
                          {item.current_quantity}
                        </TableCell>
                        <TableCell className="text-center">
                          <ItemFormModal
                            item={item}
                            trigger={
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
                              >
                                <Edit2 className="h-3 w-3 mr-2" /> Registrar
                              </Button>
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {mergeItem && (
        <MergeItemModal
          item={mergeItem}
          open={!!mergeItem}
          onOpenChange={(open) => !open && setMergeItem(null)}
        />
      )}
    </div>
  )
}
