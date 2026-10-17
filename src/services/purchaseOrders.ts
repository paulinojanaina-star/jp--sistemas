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
    item: row.items,
  }))

  return { data: formatted, error: null }
}

export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput,
): Promise<{ data: PurchaseOrder | null; error: any }> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .insert({
      request_number: input.request_number.trim(),
      item_id: input.item_id,
      quantity_ordered: input.quantity_ordered,
      quantity_received: 0,
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

  return {
    data: {
      ...data,
      quantity_ordered: Number(data.quantity_ordered),
      quantity_received: Number(data.quantity_received || 0),
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
  const { error: orderError } = await supabase
    .from('purchase_orders')
    .update({
      quantity_received: newReceivedTotal,
      status: nextStatus,
    })
    .eq('id', currentOrder.id)

  if (orderError) return { error: orderError }

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
