import { supabase } from '@/lib/supabase/client'
import {
  PurchaseOrder,
  CreatePurchaseOrderInput,
  RegisterReceiptInput,
} from '@/types/purchaseOrder'

export async function fetchPurchaseOrders(): Promise<{
  data: PurchaseOrder[] | null
  error: any
}> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, items(*)')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error }

  const formatted: PurchaseOrder[] = (data || []).map((row: any) => ({
    ...row,
    quantity_ordered: Number(row.quantity_ordered),
    quantity_received: Number(row.quantity_received || 0),
    unit_price: row.unit_price != null ? Number(row.unit_price) : null,
    total_price: row.total_price != null ? Number(row.total_price) : null,
    item: row.items,
  }))

  return { data: formatted, error: null }
}

export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput,
): Promise<{ data: PurchaseOrder | null; error: any }> {
  const unitPrice =
    input.unit_price !== undefined && input.unit_price !== null ? Number(input.unit_price) : 0
  const totalPrice =
    input.total_price !== undefined && input.total_price !== null
      ? Number(input.total_price)
      : unitPrice * Number(input.quantity_ordered)

  const { data, error } = await supabase
    .from('purchase_orders')
    .insert({
      request_number: input.request_number.trim(),
      item_id: input.item_id,
      quantity_ordered: input.quantity_ordered,
      quantity_received: 0,
      unit_price: unitPrice,
      total_price: totalPrice,
      status: 'PENDING',
      supplier: input.supplier?.trim() || null,
      health_unit_name: input.health_unit_name?.trim() || null,
      requested_at: input.requested_at,
      expected_date: input.expected_date || null,
      notes: input.notes?.trim() || null,
    })
    .select('*, items(*)')
    .single()

  if (error) return { data: null, error }

  // Se um valor unitário positivo foi informado, atualizar o preço do item na tabela items
  // para que o Controle Financeiro e relatórios reflitam o preço mais recente de compra
  if (unitPrice > 0) {
    const itemUpdates: Record<string, any> = { unit_price: unitPrice }
    if (input.supplier?.trim()) {
      itemUpdates.supplier = input.supplier.trim()
    }
    await supabase.from('items').update(itemUpdates).eq('id', input.item_id)
  }

  return {
    data: {
      ...data,
      quantity_ordered: Number(data.quantity_ordered),
      quantity_received: Number(data.quantity_received || 0),
      unit_price: data.unit_price != null ? Number(data.unit_price) : null,
      total_price: data.total_price != null ? Number(data.total_price) : null,
      item: data.items,
    },
    error: null,
  }
}

export async function registerOrderReceipt(
  currentOrder: PurchaseOrder,
  receipt: RegisterReceiptInput,
  userId: string,
): Promise<{ error?: any }> {
  const newReceivedTotal = currentOrder.quantity_received + receipt.quantity_received_now
  const isFull = newReceivedTotal >= currentOrder.quantity_ordered
  const nextStatus = isFull ? 'RECEIVED' : 'PARTIAL'

  // 1. Create IN movement in inventory_movements
  // This automatically increases items.current_quantity via trigger process_inventory_movement
  const movementPayload: any = {
    item_id: receipt.item_id,
    type: 'IN',
    quantity: receipt.quantity_received_now,
    health_unit_name:
      receipt.health_unit_name || currentOrder.health_unit_name || 'Almoxarifado Central',
    responsible_id: userId,
    batch_number: receipt.batch_number?.trim() || null,
    expiry_date: receipt.expiry_date || null,
    observations: receipt.observations?.trim()
      ? `Recebimento Ref. Pedido Nº ${currentOrder.request_number}: ${receipt.observations.trim()}`
      : `Recebimento Ref. Pedido Nº ${currentOrder.request_number}`,
  }

  if (receipt.received_at) {
    // If received_at is specified, we can set created_at timestamp
    movementPayload.created_at = new Date(`${receipt.received_at}T12:00:00Z`).toISOString()
  }

  const { error: moveError } = await supabase.from('inventory_movements').insert(movementPayload)

  if (moveError) return { error: moveError }

  // 2. Update purchase_orders with accumulated quantity_received and status
  const orderUpdates: Record<string, any> = {
    quantity_received: newReceivedTotal,
    status: nextStatus,
  }

  // Se foi fornecido um valor unitário atualizado no momento do recebimento, atualizar também o pedido
  if (receipt.unit_price !== undefined && receipt.unit_price !== null && receipt.unit_price > 0) {
    orderUpdates.unit_price = Number(receipt.unit_price)
    orderUpdates.total_price = Number(receipt.unit_price) * Number(currentOrder.quantity_ordered)
  }

  const { error: orderError } = await supabase
    .from('purchase_orders')
    .update(orderUpdates)
    .eq('id', currentOrder.id)

  if (orderError) return { error: orderError }

  // 3. Atualizar o preço unitário do item na tabela items se informado no recebimento
  // Garantindo que a aba Controle Financeiro mostre o valor real da nota recebida
  const finalUnitPrice =
    receipt.unit_price !== undefined && receipt.unit_price !== null && receipt.unit_price > 0
      ? Number(receipt.unit_price)
      : currentOrder.unit_price && currentOrder.unit_price > 0
        ? Number(currentOrder.unit_price)
        : null

  if (finalUnitPrice && finalUnitPrice > 0) {
    await supabase.from('items').update({ unit_price: finalUnitPrice }).eq('id', receipt.item_id)
  }

  return {}
}

export async function cancelPurchaseOrder(
  orderId: string,
  justification: string,
): Promise<{ error?: any }> {
  const { data: existing, error: fetchErr } = await supabase
    .from('purchase_orders')
    .select('notes')
    .eq('id', orderId)
    .single()

  if (fetchErr) return { error: fetchErr }

  const todayStr = new Date().toLocaleDateString('pt-BR')
  const cancellationNote = `[CANCELADO em ${todayStr}]: ${justification.trim()}`
  const combinedNotes = existing?.notes
    ? `${existing.notes}\n${cancellationNote}`
    : cancellationNote

  const { error } = await supabase
    .from('purchase_orders')
    .update({
      status: 'CANCELLED',
      notes: combinedNotes,
    })
    .eq('id', orderId)

  return { error }
}
