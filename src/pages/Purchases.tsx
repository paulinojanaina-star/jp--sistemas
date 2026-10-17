import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ShoppingCart,
  PlusCircle,
  Clock,
  Truck,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowDownToLine,
  Ban,
  FileText,
  RotateCcw,
  Building2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { useInventoryStore } from '@/stores/useInventoryStore'
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  CreatePurchaseOrderInput,
  RegisterReceiptInput,
} from '@/types/purchaseOrder'
import {
  fetchPurchaseOrders,
  createPurchaseOrder,
  registerOrderReceipt,
  cancelPurchaseOrder,
} from '@/services/purchaseOrders'
import { formatItemDisplay } from '@/utils/itemFormat'
import { CreateOrderModal } from '@/components/purchases/CreateOrderModal'
import { RegisterReceiptModal } from '@/components/purchases/RegisterReceiptModal'
import { CancelOrderModal } from '@/components/purchases/CancelOrderModal'

export default function Purchases() {
  const { toast } = useToast()
  const { session } = useAuth()
  const { items, refreshData: refreshInventory } = useInventoryStore()

  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [unitFilter, setUnitFilter] = useState<string>('ALL')

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [receiptOrder, setReceiptOrder] = useState<PurchaseOrder | null>(null)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [cancelOrder, setCancelOrder] = useState<PurchaseOrder | null>(null)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  // Load orders
  const loadOrders = useCallback(async () => {
    setLoading(true)
    const { data, error } = await fetchPurchaseOrders()
    if (error) {
      toast({
        title: 'Erro ao carregar pedidos',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      setOrders(data || [])
    }
    setLoading(false)
  }, [toast])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Health units list from both orders and items/movements
  const healthUnits = useMemo(() => {
    const set = new Set<string>()
    orders.forEach((o) => {
      if (o.health_unit_name) set.add(o.health_unit_name)
    })
    // Add common health units
    set.add('APS')
    set.add('Almoxarifado Central')
    set.add('LINE HOSP')
    return Array.from(set).sort()
  }, [orders])

  // Summary Metrics
  const metrics = useMemo(() => {
    let openOrdersCount = 0
    let totalPendingQty = 0
    let totalPendingValue = 0
    let hasPriceAvailable = false

    orders.forEach((order) => {
      if (order.status === 'PENDING' || order.status === 'PARTIAL') {
        openOrdersCount += 1
        const pending = Math.max(0, order.quantity_ordered - order.quantity_received)
        totalPendingQty += pending

        const unitPrice = order.item?.unit_price ? Number(order.item.unit_price) : 0
        if (unitPrice > 0) {
          hasPriceAvailable = true
          totalPendingValue += pending * unitPrice
        }
      }
    })

    return {
      openOrdersCount,
      totalPendingQty,
      totalPendingValue,
      hasPriceAvailable,
    }
  }, [orders])

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false
      }

      // Unit filter
      if (unitFilter !== 'ALL' && order.health_unit_name !== unitFilter) {
        return false
      }

      // Search term (request_number, item name, supplier, notes)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const reqMatch = order.request_number.toLowerCase().includes(query)
        const itemMatch = order.item?.name?.toLowerCase().includes(query) || false
        const supplierMatch = order.supplier?.toLowerCase().includes(query) || false
        const notesMatch = order.notes?.toLowerCase().includes(query) || false
        if (!reqMatch && !itemMatch && !supplierMatch && !notesMatch) {
          return false
        }
      }

      return true
    })
  }, [orders, statusFilter, unitFilter, searchTerm])

  // Handlers
  const handleCreateOrder = async (values: CreatePurchaseOrderInput): Promise<boolean> => {
    const { data, error } = await createPurchaseOrder(values)
    if (error) {
      toast({
        title: 'Erro ao criar solicitação',
        description: error.message,
        variant: 'destructive',
      })
      return false
    }

    toast({
      title: 'Solicitação Criada com Sucesso!',
      description: `Pedido Nº ${values.request_number} cadastrado.`,
    })
    await loadOrders()
    return true
  }

  const handleRegisterReceipt = async (receipt: RegisterReceiptInput): Promise<boolean> => {
    if (!receiptOrder || !session?.user?.id) {
      toast({
        title: 'Erro de sessão',
        description: 'Usuário não autenticado.',
        variant: 'destructive',
      })
      return false
    }

    const { error } = await registerOrderReceipt(receiptOrder, receipt, session.user.id)
    if (error) {
      toast({
        title: 'Erro ao registrar recebimento',
        description: error.message,
        variant: 'destructive',
      })
      return false
    }

    toast({
      title: 'Recebimento Registrado!',
      description: `Entrada de ${receipt.quantity_received_now} unidades inserida no estoque com sucesso.`,
    })

    await Promise.all([loadOrders(), refreshInventory()])
    return true
  }

  const handleCancelOrder = async (orderId: string, justification: string): Promise<boolean> => {
    const { error } = await cancelPurchaseOrder(orderId, justification)
    if (error) {
      toast({
        title: 'Erro ao cancelar pedido',
        description: error.message,
        variant: 'destructive',
      })
      return false
    }

    toast({
      title: 'Pedido Cancelado',
      description: 'O status do pedido foi atualizado para cancelado.',
    })

    await loadOrders()
    return true
  }

  const renderStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold gap-1"
          >
            <Clock className="h-3 w-3" /> ⏳ Pendente
          </Badge>
        )
      case 'PARTIAL':
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 font-bold gap-1"
          >
            <AlertCircle className="h-3 w-3" /> 🟡 Parcial
          </Badge>
        )
      case 'RECEIVED':
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold gap-1"
          >
            <CheckCircle2 className="h-3 w-3" /> ✅ Recebido
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge
            variant="outline"
            className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 font-bold gap-1 line-through"
          >
            <XCircle className="h-3 w-3" /> ❌ Cancelado
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-[2rem] border border-border/50 shadow-2xl p-6 lg:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900/90 text-white">
        <div
          className="absolute inset-0 z-0 opacity-25 mix-blend-luminosity"
          style={{
            backgroundImage:
              'url("https://img.usecurling.com/p/1920/600?q=supply%20chain%20warehouse%20logistics&color=blue&dpr=2")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-black uppercase tracking-widest mb-3 backdrop-blur-md">
              <ShoppingCart className="h-3.5 w-3.5" />
              Gestão de Suprimentos
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-md">
              Controle de Pedidos de Compra
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl mt-1 font-medium">
              Acompanhe ordens de fornecimento, registre entregas totais ou parciais e integre
              entradas automaticamente ao estoque físico.
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => setCreateModalOpen(true)}
            className="shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black px-6 h-12 rounded-xl flex items-center gap-2 self-start md:self-center"
          >
            <PlusCircle className="h-5 w-5" />
            Nova Solicitação
          </Button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Pedidos em Aberto */}
        <Card className="rounded-2xl border-border/60 shadow-md bg-card/90 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Pedidos em Aberto
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-foreground">
              {metrics.openOrdersCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendentes ou com entrega parcial aguardando conclusão
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Quantidade em Trânsito */}
        <Card className="rounded-2xl border-border/60 shadow-md bg-card/90 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Qtd. em Trânsito / Pendente
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Truck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-foreground">
              {metrics.totalPendingQty.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de unidades compradas ainda não entregues
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Valor em Trânsito (se houver preço unitário) */}
        {metrics.hasPriceAvailable && (
          <Card className="rounded-2xl border-border/60 shadow-md bg-card/90 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Valor Estimado em Trânsito
              </CardTitle>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                R${' '}
                {metrics.totalPendingValue.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Calculado com base no preço unitário dos itens cadastrados
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-2xl border-border/60 shadow-md">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nº da solicitação, item, fornecedor ou observações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11 text-sm rounded-xl font-medium"
              />
            </div>

            {/* Filter by Status */}
            <div className="w-full lg:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 rounded-xl">
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Status</SelectItem>
                  <SelectItem value="PENDING">⏳ Pendentes</SelectItem>
                  <SelectItem value="PARTIAL">🟡 Parciais</SelectItem>
                  <SelectItem value="RECEIVED">✅ Recebidos</SelectItem>
                  <SelectItem value="CANCELLED">❌ Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Health Unit */}
            <div className="w-full lg:w-56">
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger className="h-11 rounded-xl">
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Unidade de Destino" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as Unidades</SelectItem>
                  {healthUnits.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters */}
            {(searchTerm || statusFilter !== 'ALL' || unitFilter !== 'ALL') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('ALL')
                  setUnitFilter('ALL')
                }}
                className="h-11 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="rounded-2xl border-border/60 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-4 pl-6">
                  Nº Solicitação
                </TableHead>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-4">
                  Item
                </TableHead>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-4">
                  Fornecedor / Destino
                </TableHead>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-4 text-center">
                  Comprada
                </TableHead>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-4 text-center">
                  Recebida
                </TableHead>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-4 text-center">
                  Pendente
                </TableHead>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-4 text-center">
                  Status
                </TableHead>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-4 pr-6 text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm font-medium">Carregando pedidos de compra...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="p-3 rounded-full bg-muted">
                        <ShoppingCart className="h-8 w-8 opacity-40" />
                      </div>
                      <p className="font-bold text-base text-foreground">
                        Nenhum pedido de compra encontrado
                      </p>
                      <p className="text-xs max-w-sm">
                        {searchTerm || statusFilter !== 'ALL' || unitFilter !== 'ALL'
                          ? 'Tente ajustar ou limpar os filtros de busca para visualizar os registros.'
                          : 'Clique em "Nova Solicitação" para registrar sua primeira ordem de compra.'}
                      </p>
                      {searchTerm || statusFilter !== 'ALL' || unitFilter !== 'ALL' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchTerm('')
                            setStatusFilter('ALL')
                            setUnitFilter('ALL')
                          }}
                          className="mt-2 text-xs"
                        >
                          Limpar Filtros
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setCreateModalOpen(true)}
                          className="mt-2 font-bold"
                        >
                          <PlusCircle className="h-4 w-4 mr-1.5" />
                          Criar Primeira Solicitação
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const pendingQty = Math.max(0, order.quantity_ordered - order.quantity_received)
                  const unitType = order.item?.unit_type || 'un'
                  const isOpen = order.status === 'PENDING' || order.status === 'PARTIAL'

                  const requestedDateFormatted = order.requested_at
                    ? new Date(order.requested_at + 'T00:00:00').toLocaleDateString('pt-BR')
                    : '-'

                  const expectedDateFormatted = order.expected_date
                    ? new Date(order.expected_date + 'T00:00:00').toLocaleDateString('pt-BR')
                    : null

                  return (
                    <TableRow key={order.id} className="hover:bg-muted/40 transition-colors">
                      {/* Nº Solicitação */}
                      <TableCell className="py-4 pl-6 align-top">
                        <div className="font-mono font-black text-sm text-foreground flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span>{order.request_number}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Solicitado em: {requestedDateFormatted}
                        </div>
                        {expectedDateFormatted && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                            Previsão: {expectedDateFormatted}
                          </div>
                        )}
                      </TableCell>

                      {/* Item */}
                      <TableCell className="py-4 align-top max-w-[240px]">
                        <div className="font-bold text-sm text-foreground leading-snug">
                          {order.item ? formatItemDisplay(order.item) : 'Item não identificado'}
                        </div>
                        {order.item && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Saldo em estoque: {order.item.current_quantity} {order.item.unit_type}
                          </div>
                        )}
                        {order.notes && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-[11px] text-muted-foreground/90 italic truncate mt-1 max-w-[220px] cursor-help">
                                  Obs: {order.notes}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs whitespace-pre-wrap">
                                {order.notes}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>

                      {/* Fornecedor / Destino */}
                      <TableCell className="py-4 align-top">
                        <div className="text-xs font-semibold text-foreground">
                          {order.supplier || (
                            <span className="text-muted-foreground italic font-normal">
                              Não informado
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span>{order.health_unit_name || 'Almoxarifado Central'}</span>
                        </div>
                      </TableCell>

                      {/* Comprada */}
                      <TableCell className="py-4 align-top text-center font-mono font-bold text-sm">
                        {order.quantity_ordered}{' '}
                        <span className="text-xs font-normal text-muted-foreground">
                          {unitType}
                        </span>
                      </TableCell>

                      {/* Recebida */}
                      <TableCell className="py-4 align-top text-center font-mono font-bold text-sm">
                        <span
                          className={
                            order.quantity_received > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-muted-foreground'
                          }
                        >
                          {order.quantity_received}{' '}
                          <span className="text-xs font-normal text-muted-foreground">
                            {unitType}
                          </span>
                        </span>
                      </TableCell>

                      {/* Pendente */}
                      <TableCell className="py-4 align-top text-center font-mono font-black text-sm">
                        {pendingQty > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">
                            {pendingQty}{' '}
                            <span className="text-xs font-normal text-muted-foreground">
                              {unitType}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs font-normal">
                            0 (Zerado)
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-4 align-top text-center">
                        {renderStatusBadge(order.status)}
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="py-4 pr-6 align-top text-right">
                        {isOpen ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setReceiptOrder(order)
                                setReceiptModalOpen(true)
                              }}
                              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 px-2.5"
                            >
                              <ArrowDownToLine className="h-3.5 w-3.5" />
                              Receber
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setCancelOrder(order)
                                setCancelModalOpen(true)
                              }}
                              className="h-8 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
                              title="Cancelar pedido"
                            >
                              <Ban className="h-3.5 w-3.5 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Concluído</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modals */}
      <CreateOrderModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        items={items}
        existingUnits={healthUnits}
        onSubmit={handleCreateOrder}
      />

      <RegisterReceiptModal
        order={receiptOrder}
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        onSubmit={handleRegisterReceipt}
      />

      <CancelOrderModal
        order={cancelOrder}
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        onConfirm={handleCancelOrder}
      />
    </div>
  )
}
