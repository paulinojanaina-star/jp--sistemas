import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  ChevronDown,
  ChevronUp,
  Layers,
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
import { ExportButtons } from '@/components/ExportButtons'
import { GenericExportOptions } from '@/utils/exportGeneric'
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
import { EditOrderModal } from '@/components/purchases/EditOrderModal'
import { UpdatePurchaseOrderInput } from '@/types/purchaseOrder'
import { updatePurchaseOrder } from '@/services/purchaseOrders'
import { Pencil } from 'lucide-react'

export default function Purchases() {
  const { toast } = useToast()
  const { session } = useAuth()
  const { items, refreshData: refreshInventory } = useInventoryStore()
  const location = useLocation()
  const navigate = useNavigate()

  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)

  // Track expanded order rows to view item details
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({})

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }))
  }

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [unitFilter, setUnitFilter] = useState<string>('ALL')

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [draftOrderData, setDraftOrderData] = useState<any>(null)
  const [receiptOrder, setReceiptOrder] = useState<PurchaseOrder | null>(null)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [cancelOrder, setCancelOrder] = useState<PurchaseOrder | null>(null)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [editOrder, setEditOrder] = useState<PurchaseOrder | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Detect draft order passed via navigation state from PurchasePredictionReport
  useEffect(() => {
    const state = location.state as { draftOrder?: any } | null
    if (state?.draftOrder) {
      setDraftOrderData(state.draftOrder)
      setCreateModalOpen(true)
      // Clear navigation state so refreshing or subsequent interactions don't re-trigger
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, navigate, location.pathname])

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

  // Summary Metrics (supports multi-item orders)
  const metrics = useMemo(() => {
    let openOrdersCount = 0
    let totalPendingQty = 0
    let totalPendingValue = 0
    let hasPriceAvailable = false

    orders.forEach((order) => {
      if (order.status === 'PENDING' || order.status === 'PARTIAL') {
        openOrdersCount += 1

        if (order.order_items && order.order_items.length > 0) {
          order.order_items.forEach((poi) => {
            const pending = Math.max(0, poi.quantity_ordered - poi.quantity_received)
            totalPendingQty += pending
            const price =
              poi.unit_price > 0
                ? poi.unit_price
                : poi.item?.unit_price
                  ? Number(poi.item.unit_price)
                  : 0

            if (price > 0) {
              hasPriceAvailable = true
              totalPendingValue += pending * price
            }
          })
        } else {
          // Fallback legacy calculation
          const pending = Math.max(0, order.quantity_ordered - order.quantity_received)
          totalPendingQty += pending

          const orderUnitPrice =
            order.unit_price !== undefined &&
            order.unit_price !== null &&
            Number(order.unit_price) > 0
              ? Number(order.unit_price)
              : order.item?.unit_price
                ? Number(order.item.unit_price)
                : 0

          if (orderUnitPrice > 0) {
            hasPriceAvailable = true
            totalPendingValue += pending * orderUnitPrice
          }
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

      // Search term (request_number, any item name, supplier, notes)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const reqMatch = order.request_number.toLowerCase().includes(query)
        const supplierMatch = order.supplier?.toLowerCase().includes(query) || false
        const notesMatch = order.notes?.toLowerCase().includes(query) || false

        // Check if any item matches the query
        const anyItemMatch =
          order.order_items?.some((poi) => poi.item?.name?.toLowerCase().includes(query)) ||
          order.item?.name?.toLowerCase().includes(query) ||
          false

        if (!reqMatch && !anyItemMatch && !supplierMatch && !notesMatch) {
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

    const itemsCount = values.items?.length || 1
    toast({
      title: 'Solicitação Criada com Sucesso!',
      description: `Pedido Nº ${values.request_number} com ${itemsCount} ${itemsCount === 1 ? 'item cadastrado' : 'itens cadastrados'}.`,
    })
    await Promise.all([loadOrders(), refreshInventory()])
    return true
  }

  const handleUpdateOrder = async (values: UpdatePurchaseOrderInput): Promise<boolean> => {
    const { error } = await updatePurchaseOrder(values)
    if (error) {
      toast({
        title: 'Erro ao editar solicitação',
        description: error.message,
        variant: 'destructive',
      })
      return false
    }

    const itemsCount = values.items?.length || 1
    toast({
      title: 'Solicitação Atualizada com Sucesso!',
      description: `Pedido Nº ${values.request_number} atualizado com ${itemsCount} ${itemsCount === 1 ? 'item' : 'itens'}.`,
    })
    await Promise.all([loadOrders(), refreshInventory()])
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

    const totalReceivedUnits =
      receipt.items?.reduce((acc, r) => acc + (Number(r.quantity_received_now) || 0), 0) || 0

    toast({
      title: 'Recebimento Registrado!',
      description: `Entrada de ${totalReceivedUnits.toLocaleString('pt-BR')} unidades inserida no estoque com sucesso.`,
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
      description: 'O status do pedido e seus itens foram cancelados com sucesso.',
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
              Cadastre solicitações com múltiplos itens, acompanhe entregas parciais ou totais e
              integre automaticamente ao estoque e ao financeiro.
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
                Calculado com base no valor unitário informado nos itens
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

            <div className="ml-auto flex items-center gap-2">
              <ExportButtons
                disabled={filteredOrders.length === 0}
                options={(): GenericExportOptions<PurchaseOrder> => ({
                  filename: 'solicitacoes-compras',
                  title: 'Relatório de Solicitações de Compras',
                  subtitle: `Status: ${statusFilter} | Unidade: ${unitFilter} | Total: ${filteredOrders.length} pedidos`,
                  filters: [
                    { label: 'Status', value: statusFilter },
                    { label: 'Unidade Destino', value: unitFilter },
                    { label: 'Termo de Busca', value: searchTerm || 'Todos' },
                  ],
                  data: filteredOrders,
                  columns: [
                    { header: 'Nº Solicitação', key: 'request_number' },
                    {
                      header: 'Data Solicitação',
                      accessor: (o) =>
                        o.requested_at
                          ? new Date(o.requested_at + 'T00:00:00').toLocaleDateString('pt-BR')
                          : '-',
                    },
                    {
                      header: 'Previsão de Entrega',
                      accessor: (o) =>
                        o.expected_date
                          ? new Date(o.expected_date + 'T00:00:00').toLocaleDateString('pt-BR')
                          : '-',
                    },
                    {
                      header: 'Itens Detalhados',
                      accessor: (o) => {
                        if (o.order_items && o.order_items.length > 0) {
                          return o.order_items
                            .map(
                              (it) =>
                                `${it.item?.name || 'Item'} (${it.quantity_ordered} ${it.item?.unit_type || 'un'})`,
                            )
                            .join('; ')
                        }
                        return o.item ? o.item.name : '-'
                      },
                    },
                    { header: 'Fornecedor', accessor: (o) => o.supplier || '-' },
                    { header: 'Unidade Destino', accessor: (o) => o.health_unit_name || '-' },
                    {
                      header: 'Qtd. Total Comprada',
                      accessor: (o) => o.quantity_ordered,
                      align: 'right',
                    },
                    {
                      header: 'Qtd. Total Recebida',
                      accessor: (o) => o.quantity_received,
                      align: 'right',
                    },
                    {
                      header: 'Qtd. Total Pendente',
                      accessor: (o) => Math.max(0, o.quantity_ordered - o.quantity_received),
                      align: 'right',
                    },
                    {
                      header: 'Valor Total da Nota (R$)',
                      accessor: (o) =>
                        o.total_price > 0
                          ? new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(o.total_price)
                          : 'R$ 0,00',
                      align: 'right',
                    },
                    {
                      header: 'Status',
                      accessor: (o) => {
                        if (o.status === 'PENDING') return 'Pendente'
                        if (o.status === 'PARTIAL') return 'Recebida Parcial'
                        if (o.status === 'RECEIVED') return 'Recebida Total'
                        if (o.status === 'CANCELLED') return 'Cancelada'
                        return o.status
                      },
                    },
                    { header: 'Observações', accessor: (o) => o.notes || '-' },
                  ],
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="rounded-2xl border-border/60 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-4 py-4"></TableHead>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-4 pl-2">
                  Nº Solicitação
                </TableHead>
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-4">
                  Itens Incluídos
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
                <TableHead className="font-extrabold text-xs uppercase tracking-wider py-4 text-right">
                  Valor Total da Nota
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
                  <TableCell colSpan={10} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-sm font-medium">Carregando pedidos de compra...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-44 text-center">
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
                  const itemsList =
                    order.order_items && order.order_items.length > 0 ? order.order_items : []
                  const itemsCount = itemsList.length > 0 ? itemsList.length : 1
                  const isExpanded = !!expandedOrders[order.id]

                  const pendingQty = Math.max(0, order.quantity_ordered - order.quantity_received)
                  const isOpen = order.status === 'PENDING' || order.status === 'PARTIAL'

                  const requestedDateFormatted = order.requested_at
                    ? new Date(order.requested_at + 'T00:00:00').toLocaleDateString('pt-BR')
                    : '-'

                  const expectedDateFormatted = order.expected_date
                    ? new Date(order.expected_date + 'T00:00:00').toLocaleDateString('pt-BR')
                    : null

                  return (
                    <>
                      <TableRow key={order.id} className="hover:bg-muted/40 transition-colors">
                        {/* Toggle button */}
                        <TableCell className="pl-4 py-4 align-top w-10">
                          {itemsList.length > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => toggleOrderExpanded(order.id)}
                              title={isExpanded ? 'Recolher detalhes' : 'Ver todos os itens'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          ) : null}
                        </TableCell>

                        {/* Nº Solicitação */}
                        <TableCell className="py-4 pl-2 align-top">
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

                        {/* Itens Incluídos */}
                        <TableCell className="py-4 align-top max-w-[280px]">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="font-bold text-xs gap-1 bg-primary/10 text-primary border-primary/20 shrink-0"
                            >
                              <Layers className="h-3 w-3" />
                              {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
                            </Badge>
                          </div>

                          {/* Preview dos primeiros itens */}
                          <div className="mt-1.5 space-y-0.5">
                            {itemsList.length > 0 ? (
                              itemsList.slice(0, 2).map((it) => (
                                <div
                                  key={it.id}
                                  className="text-xs font-semibold text-foreground truncate"
                                >
                                  • {it.item ? formatItemDisplay(it.item) : 'Item'}{' '}
                                  <span className="text-[11px] font-normal text-muted-foreground">
                                    ({it.quantity_ordered} {it.item?.unit_type || 'un'})
                                  </span>
                                </div>
                              ))
                            ) : order.item ? (
                              <div className="text-xs font-semibold text-foreground truncate">
                                • {formatItemDisplay(order.item)}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground italic">
                                Itens não identificados
                              </div>
                            )}

                            {itemsList.length > 2 && (
                              <button
                                type="button"
                                onClick={() => toggleOrderExpanded(order.id)}
                                className="text-[11px] text-primary hover:underline font-semibold block"
                              >
                                + {itemsList.length - 2} outros{' '}
                                {itemsList.length - 2 === 1 ? 'item' : 'itens'}...
                              </button>
                            )}
                          </div>

                          {order.notes && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-[11px] text-muted-foreground/90 italic truncate mt-1 max-w-[240px] cursor-help">
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
                          {order.quantity_ordered.toLocaleString('pt-BR')}{' '}
                          <span className="text-xs font-normal text-muted-foreground">unid.</span>
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
                            {order.quantity_received.toLocaleString('pt-BR')}{' '}
                            <span className="text-xs font-normal text-muted-foreground">unid.</span>
                          </span>
                        </TableCell>

                        {/* Pendente */}
                        <TableCell className="py-4 align-top text-center font-mono font-black text-sm">
                          {pendingQty > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              {pendingQty.toLocaleString('pt-BR')}{' '}
                              <span className="text-xs font-normal text-muted-foreground">
                                unid.
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs font-normal">
                              0 (Zerado)
                            </span>
                          )}
                        </TableCell>

                        {/* Valor Total da Nota */}
                        <TableCell className="py-4 align-top text-right font-mono">
                          {order.total_price > 0 ? (
                            <div>
                              <div className="font-extrabold text-sm text-foreground">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(order.total_price)}
                              </div>
                              <div className="text-[10px] text-muted-foreground">Total da Nota</div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic font-sans">
                              Não informado
                            </span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-4 align-top text-center">
                          {renderStatusBadge(order.status)}
                        </TableCell>

                        {/* Ações */}
                        <TableCell className="py-4 pr-6 align-top text-right">
                          {order.status !== 'CANCELLED' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botão Editar Solicitação */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditOrder(order)
                                  setEditModalOpen(true)
                                }}
                                className="h-8 text-xs font-semibold hover:bg-primary/10 hover:text-primary border-border/80 gap-1 px-2.5"
                                title="Editar solicitação e itens"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Editar
                              </Button>

                              {isOpen && (
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
                              )}

                              {isOpen && (
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
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Cancelado</span>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Expanded row with itemized details */}
                      {isExpanded && itemsList.length > 0 && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30 border-t-0">
                          <TableCell colSpan={10} className="p-4 pl-12 pr-6">
                            <div className="rounded-xl border bg-card p-3 shadow-sm space-y-2">
                              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground flex flex-wrap items-center justify-between gap-2">
                                <span>
                                  Detalhamento dos Itens ({itemsList.length}) - pedido nº{' '}
                                  {order.request_number}
                                </span>
                                <ExportButtons
                                  size="sm"
                                  disabled={itemsList.length === 0}
                                  options={(): GenericExportOptions<any> => ({
                                    filename: `itens-pedido-${order.request_number.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                                    title: `Itens da Solicitação de Compra Nº ${order.request_number}`,
                                    subtitle: `Fornecedor: ${order.supplier || 'N/A'} | Destino: ${order.health_unit_name || 'N/A'}`,
                                    filters: [
                                      { label: 'Nº Pedido', value: order.request_number },
                                      { label: 'Fornecedor', value: order.supplier },
                                      { label: 'Destino', value: order.health_unit_name },
                                      { label: 'Data', value: requestedDateFormatted },
                                    ],
                                    data: itemsList,
                                    columns: [
                                      {
                                        header: 'Item',
                                        accessor: (poi) =>
                                          poi.item ? formatItemDisplay(poi.item) : 'Item',
                                      },
                                      {
                                        header: 'Unidade',
                                        accessor: (poi) => poi.item?.unit_type || 'un',
                                      },
                                      {
                                        header: 'Saldo Atual em Estoque',
                                        accessor: (poi) => poi.item?.current_quantity || 0,
                                        align: 'right',
                                      },
                                      {
                                        header: 'Qtd. Comprada',
                                        accessor: (poi) => poi.quantity_ordered,
                                        align: 'right',
                                      },
                                      {
                                        header: 'Qtd. Recebida',
                                        accessor: (poi) => poi.quantity_received,
                                        align: 'right',
                                      },
                                      {
                                        header: 'Qtd. Pendente',
                                        accessor: (poi) =>
                                          Math.max(0, poi.quantity_ordered - poi.quantity_received),
                                        align: 'right',
                                      },
                                      {
                                        header: 'Preço Unitário (R$)',
                                        accessor: (poi) =>
                                          new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL',
                                          }).format(poi.unit_price || 0),
                                        align: 'right',
                                      },
                                      {
                                        header: 'Subtotal (R$)',
                                        accessor: (poi) =>
                                          new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL',
                                          }).format(poi.total_price || 0),
                                        align: 'right',
                                      },
                                    ],
                                  })}
                                />
                              </div>
                              <div className="divide-y divide-border/60">
                                {itemsList.map((poi, idx) => {
                                  const poiPending = Math.max(
                                    0,
                                    poi.quantity_ordered - poi.quantity_received,
                                  )
                                  const poiUnit = poi.item?.unit_type || 'un'
                                  return (
                                    <div
                                      key={poi.id}
                                      className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono text-muted-foreground font-bold">
                                          #{idx + 1}
                                        </span>
                                        <div className="truncate">
                                          <div className="font-bold text-foreground">
                                            {poi.item ? formatItemDisplay(poi.item) : 'Item'}
                                          </div>
                                          <div className="text-[11px] text-muted-foreground">
                                            Saldo atual em estoque:{' '}
                                            {poi.item?.current_quantity || 0} {poiUnit}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-4 sm:gap-6 shrink-0 self-end sm:self-center font-mono">
                                        <div className="text-center">
                                          <span className="text-[10px] text-muted-foreground block uppercase">
                                            Comprado
                                          </span>
                                          <span className="font-bold text-foreground">
                                            {poi.quantity_ordered} {poiUnit}
                                          </span>
                                        </div>
                                        <div className="text-center">
                                          <span className="text-[10px] text-muted-foreground block uppercase">
                                            Recebido
                                          </span>
                                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            {poi.quantity_received} {poiUnit}
                                          </span>
                                        </div>
                                        <div className="text-center">
                                          <span className="text-[10px] text-muted-foreground block uppercase">
                                            Pendente
                                          </span>
                                          <span className="font-black text-amber-600 dark:text-amber-400">
                                            {poiPending} {poiUnit}
                                          </span>
                                        </div>
                                        <div className="text-right min-w-[90px]">
                                          <span className="text-[10px] text-muted-foreground block uppercase">
                                            Subtotal
                                          </span>
                                          <span className="font-black text-foreground">
                                            {new Intl.NumberFormat('pt-BR', {
                                              style: 'currency',
                                              currency: 'BRL',
                                            }).format(poi.total_price)}
                                          </span>
                                          {poi.unit_price > 0 && (
                                            <span className="text-[9px] text-muted-foreground block">
                                              {new Intl.NumberFormat('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                              }).format(poi.unit_price)}
                                              /{poiUnit}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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
        onOpenChange={(open) => {
          setCreateModalOpen(open)
          if (!open) {
            setDraftOrderData(null)
          }
        }}
        items={items}
        existingUnits={healthUnits}
        initialData={draftOrderData}
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

      <EditOrderModal
        order={editOrder}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        items={items}
        existingUnits={healthUnits}
        onSubmit={handleUpdateOrder}
      />
    </div>
  )
}
