import { supabase } from '@/lib/supabase/client'
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  CreatePurchaseOrderInput,
  RegisterReceiptInput,
} from '@/types/purchaseOrder'

export async function fetchPurchaseOrders(): Promise<{
  data: PurchaseOrder[] | null
  error: any
}> {
  // Query purchase_orders and related purchase_order_items with item details
  const { data, error } = await (supabase as any)
    .from('purchase_orders')
    .select(`
      *,
      items(*),
      purchase_order_items(
        *,
        items(*)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error }

  const formatted: PurchaseOrder[] = (data || []).map((row: any) => {
    const rawOrderItems = row.purchase_order_items || []
    const mappedOrderItems: PurchaseOrderItem[] = rawOrderItems.map((poi: any) => ({
      id: poi.id,
      purchase_order_id: poi.purchase_order_id,
      item_id: poi.item_id,
      quantity_ordered: Number(poi.quantity_ordered),
      quantity_received: Number(poi.quantity_received || 0),
      unit_price: Number(poi.unit_price || 0),
      total_price: Number(poi.total_price || 0),
      status: poi.status,
      created_at: poi.created_at,
      updated_at: poi.updated_at,
      item: poi.items,
    }))

    // Calculate aggregated totals if multiple items exist, or fallback to header
    const sumQtyOrdered =
      mappedOrderItems.length > 0
        ? mappedOrderItems.reduce((acc, it) => acc + it.quantity_ordered, 0)
        : Number(row.quantity_ordered || 0)

    const sumQtyReceived =
      mappedOrderItems.length > 0
        ? mappedOrderItems.reduce((acc, it) => acc + it.quantity_received, 0)
        : Number(row.quantity_received || 0)

    const sumTotalPrice =
      mappedOrderItems.length > 0
        ? mappedOrderItems.reduce((acc, it) => acc + it.total_price, 0)
        : Number(row.total_price || 0)

    // Primary item for legacy display
    const firstOrderItem = mappedOrderItems[0]
    const legacyItem = row.items || firstOrderItem?.item

    return {
      id: row.id,
      request_number: row.request_number,
      status: row.status,
      supplier: row.supplier,
      health_unit_name: row.health_unit_name,
      requested_at: row.requested_at,
      expected_date: row.expected_date,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      quantity_ordered: sumQtyOrdered,
      quantity_received: sumQtyReceived,
      total_price: sumTotalPrice,
      unit_price:
        row.unit_price != null ? Number(row.unit_price) : (firstOrderItem?.unit_price ?? null),
      item_id: row.item_id || firstOrderItem?.item_id || null,
      order_items: mappedOrderItems,
      item: legacyItem,
    }
  })

  return { data: formatted, error: null }
}

export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput,
): Promise<{ data: PurchaseOrder | null; error: any }> {
  // Normalize items input: either input.items array or legacy single item
  const itemsToCreate =
    input.items && input.items.length > 0
      ? input.items
      : input.item_id && input.quantity_ordered
        ? [
            {
              item_id: input.item_id,
              quantity_ordered: Number(input.quantity_ordered),
              unit_price: Number(input.unit_price || 0),
              total_price: Number(
                input.total_price || Number(input.unit_price || 0) * Number(input.quantity_ordered),
              ),
            },
          ]
        : []

  if (itemsToCreate.length === 0) {
    return { data: null, error: new Error('A solicitação precisa de pelo menos 1 item.') }
  }

  // Calculate order header totals
  let headerTotal = 0
  let headerQtyOrdered = 0

  const preparedItems = itemsToCreate.map((it) => {
    const unitPrice =
      it.unit_price != null && Number(it.unit_price) >= 0 ? Number(it.unit_price) : 0
    const qty = Number(it.quantity_ordered)
    const lineTotal =
      it.total_price != null && Number(it.total_price) >= 0
        ? Number(it.total_price)
        : unitPrice * qty
    headerTotal += lineTotal
    headerQtyOrdered += qty
    return {
      item_id: it.item_id,
      quantity_ordered: qty,
      quantity_received: 0,
      unit_price: unitPrice,
      total_price: lineTotal,
      status: 'PENDING',
    }
  })

  // 1. Insert header in purchase_orders
  const firstItem = preparedItems[0]
  const { data: orderHeader, error: headerError } = await supabase
    .from('purchase_orders')
    .insert({
      request_number: input.request_number.trim(),
      item_id: firstItem.item_id, // keep legacy field populated with first item
      quantity_ordered: headerQtyOrdered,
      quantity_received: 0,
      unit_price: firstItem.unit_price,
      total_price: headerTotal,
      status: 'PENDING',
      supplier: input.supplier?.trim() || null,
      health_unit_name: input.health_unit_name?.trim() || null,
      requested_at: input.requested_at,
      expected_date: input.expected_date || null,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single()

  if (headerError) return { data: null, error: headerError }

  // 2. Insert items in purchase_order_items
  const itemsPayload = preparedItems.map((pi) => ({
    ...pi,
    purchase_order_id: orderHeader.id,
  }))

  const { data: createdItems, error: itemsError } = await (supabase as any)
    .from('purchase_order_items')
    .insert(itemsPayload)
    .select('*, items(*)')

  if (itemsError) {
    // Attempt rollback of header if items insertion failed
    await supabase.from('purchase_orders').delete().eq('id', orderHeader.id)
    return { data: null, error: itemsError }
  }

  // 3. Se houver valor unitário informado em cada item, atualizar o preço na tabela items
  // para que o Controle Financeiro e relatórios reflitam o preço mais recente de compra
  for (const itemInput of preparedItems) {
    if (itemInput.unit_price > 0) {
      const itemUpdates: Record<string, any> = { unit_price: itemInput.unit_price }
      if (input.supplier?.trim()) {
        itemUpdates.supplier = input.supplier.trim()
      }
      await supabase.from('items').update(itemUpdates).eq('id', itemInput.item_id)
    }
  }

  const mappedOrderItems: PurchaseOrderItem[] = (createdItems || []).map((poi: any) => ({
    id: poi.id,
    purchase_order_id: poi.purchase_order_id,
    item_id: poi.item_id,
    quantity_ordered: Number(poi.quantity_ordered),
    quantity_received: Number(poi.quantity_received || 0),
    unit_price: Number(poi.unit_price || 0),
    total_price: Number(poi.total_price || 0),
    status: poi.status,
    created_at: poi.created_at,
    updated_at: poi.updated_at,
    item: poi.items,
  }))

  return {
    data: {
      id: orderHeader.id,
      request_number: orderHeader.request_number,
      status: orderHeader.status as PurchaseOrderStatus,
      supplier: orderHeader.supplier,
      health_unit_name: orderHeader.health_unit_name,
      requested_at: orderHeader.requested_at,
      expected_date: orderHeader.expected_date,
      notes: orderHeader.notes,
      created_at: orderHeader.created_at,
      updated_at: orderHeader.updated_at,
      quantity_ordered: headerQtyOrdered,
      quantity_received: 0,
      total_price: headerTotal,
      unit_price: firstItem.unit_price,
      item_id: firstItem.item_id,
      order_items: mappedOrderItems,
      item: mappedOrderItems[0]?.item,
    },
    error: null,
  }
}

export async function registerOrderReceipt(
  currentOrder: PurchaseOrder,
  receipt: RegisterReceiptInput,
  userId: string,
): Promise<{ error?: any }> {
  // Normalize items to receive: either receipt.items array or legacy single item
  let itemsToReceive = receipt.items || []

  if (itemsToReceive.length === 0 && receipt.item_id && receipt.quantity_received_now) {
    // Find matching order_item_id or use fallback
    const matched = currentOrder.order_items?.find((poi) => poi.item_id === receipt.item_id)
    itemsToReceive = [
      {
        order_item_id: matched ? matched.id : '',
        item_id: receipt.item_id,
        quantity_received_now: Number(receipt.quantity_received_now),
        unit_price: receipt.unit_price,
        batch_number: receipt.batch_number,
        expiry_date: receipt.expiry_date,
      },
    ]
  }

  // Filter only items with quantity > 0
  const activeReceipts = itemsToReceive.filter((r) => Number(r.quantity_received_now) > 0)
  if (activeReceipts.length === 0) {
    return { error: new Error('Informe a quantidade recebida de pelo menos um item.') }
  }

  // 1. Process each item receipt
  for (const itemRec of activeReceipts) {
    const qtyNow = Number(itemRec.quantity_received_now)
    const unitPrice =
      itemRec.unit_price !== undefined && itemRec.unit_price !== null
        ? Number(itemRec.unit_price)
        : undefined

    // 1.1 Create IN movement in inventory_movements
    const movementPayload: any = {
      item_id: itemRec.item_id,
      type: 'IN',
      quantity: qtyNow,
      health_unit_name:
        receipt.health_unit_name || currentOrder.health_unit_name || 'Almoxarifado Central',
      responsible_id: userId,
      batch_number: itemRec.batch_number?.trim() || null,
      expiry_date: itemRec.expiry_date || null,
      observations: receipt.observations?.trim()
        ? `Recebimento Ref. Pedido Nº ${currentOrder.request_number}: ${receipt.observations.trim()}`
        : `Recebimento Ref. Pedido Nº ${currentOrder.request_number}`,
    }

    if (receipt.received_at) {
      movementPayload.created_at = new Date(`${receipt.received_at}T12:00:00Z`).toISOString()
    }

    const { error: moveError } = await supabase.from('inventory_movements').insert(movementPayload)
    if (moveError) return { error: moveError }

    // 1.2 Update purchase_order_items row if exists
    if (itemRec.order_item_id) {
      const existingPoi = currentOrder.order_items?.find((poi) => poi.id === itemRec.order_item_id)
      const currentPoiReceived = existingPoi ? Number(existingPoi.quantity_received || 0) : 0
      const currentPoiOrdered = existingPoi ? Number(existingPoi.quantity_ordered) : qtyNow
      const newPoiReceived = currentPoiReceived + qtyNow
      const poiStatus = newPoiReceived >= currentPoiOrdered ? 'RECEIVED' : 'PARTIAL'

      const poiUpdates: Record<string, any> = {
        quantity_received: newPoiReceived,
        status: poiStatus,
      }

      if (unitPrice && unitPrice > 0) {
        poiUpdates.unit_price = unitPrice
        poiUpdates.total_price = unitPrice * currentPoiOrdered
      }

      await (supabase as any)
        .from('purchase_order_items')
        .update(poiUpdates)
        .eq('id', itemRec.order_item_id)
    }

    // 1.3 Update items table unit_price if provided
    if (unitPrice && unitPrice > 0) {
      await supabase.from('items').update({ unit_price: unitPrice }).eq('id', itemRec.item_id)
    }
  }

  // 2. Fetch updated items to calculate overall order status and header totals
  const { data: updatedOrderItems } = await (supabase as any)
    .from('purchase_order_items')
    .select('*')
    .eq('purchase_order_id', currentOrder.id)

  let overallStatus: 'PENDING' | 'PARTIAL' | 'RECEIVED' = 'RECEIVED'
  let totalOrderReceived = 0
  let totalOrderQuantity = 0
  let totalOrderPrice = 0

  if (updatedOrderItems && updatedOrderItems.length > 0) {
    let allReceived = true
    let anyReceived = false

    for (const poi of updatedOrderItems) {
      const ordered = Number(poi.quantity_ordered)
      const received = Number(poi.quantity_received || 0)
      const price = Number(poi.total_price || Number(poi.unit_price || 0) * ordered)

      totalOrderQuantity += ordered
      totalOrderReceived += received
      totalOrderPrice += price

      if (received < ordered) {
        allReceived = false
      }
      if (received > 0) {
        anyReceived = true
      }
    }

    if (allReceived) {
      overallStatus = 'RECEIVED'
    } else if (anyReceived) {
      overallStatus = 'PARTIAL'
    } else {
      overallStatus = 'PENDING'
    }
  } else {
    // Fallback for legacy order without order_items
    const totalQtyNow = activeReceipts.reduce((acc, r) => acc + Number(r.quantity_received_now), 0)
    totalOrderReceived = (currentOrder.quantity_received || 0) + totalQtyNow
    totalOrderQuantity = currentOrder.quantity_ordered || totalOrderReceived
    overallStatus = totalOrderReceived >= totalOrderQuantity ? 'RECEIVED' : 'PARTIAL'
    totalOrderPrice = currentOrder.total_price
  }

  // 3. Update purchase_orders header
  const headerUpdates: Record<string, any> = {
    quantity_received: totalOrderReceived,
    status: overallStatus,
  }
  if (totalOrderPrice > 0) {
    headerUpdates.total_price = totalOrderPrice
  }

  const { error: orderError } = await supabase
    .from('purchase_orders')
    .update(headerUpdates)
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

  if (error) return { error }

  // Mark order items as CANCELLED as well
  await (supabase as any)
    .from('purchase_order_items')
    .update({ status: 'CANCELLED' })
    .eq('purchase_order_id', orderId)

  return {}
}
