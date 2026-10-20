import { supabase } from '@/lib/supabase/client'
import {
  InventoryAuditSession,
  InventoryAuditSessionItem,
  SaveInventoryAuditInput,
} from '@/types/inventoryAudit'

export async function fetchInventoryAuditSessions(): Promise<{
  data: InventoryAuditSession[] | null
  error: any
}> {
  const { data, error } = await (supabase as any)
    .from('inventory_audit_sessions')
    .select('*, profiles(email, full_name)')
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function fetchInventoryAuditSessionDetails(sessionId: string): Promise<{
  session: InventoryAuditSession | null
  items: InventoryAuditSessionItem[]
  error: any
}> {
  const [{ data: session, error: sessionError }, { data: items, error: itemsError }] =
    await Promise.all([
      (supabase as any)
        .from('inventory_audit_sessions')
        .select('*, profiles(email, full_name)')
        .eq('id', sessionId)
        .single(),
      (supabase as any)
        .from('inventory_audit_session_items')
        .select('*, items(name, unit_type)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true }),
    ])

  return {
    session: session || null,
    items: items || [],
    error: sessionError || itemsError,
  }
}

export async function saveInventoryAudit(
  input: SaveInventoryAuditInput,
): Promise<{ success: boolean; sessionId?: string; error?: any }> {
  try {
    const totalChecked = input.items.length
    const divergentItems = input.items.filter((it) => it.countedQuantity !== it.systemQuantity)
    const positiveAdjustments = divergentItems.filter(
      (it) => it.countedQuantity > it.systemQuantity,
    )
    const negativeAdjustments = divergentItems.filter(
      (it) => it.countedQuantity < it.systemQuantity,
    )

    // 1. Criar a sessão de auditoria
    const { data: sessionData, error: sessionError } = await (supabase as any)
      .from('inventory_audit_sessions')
      .insert({
        health_unit_name: input.healthUnitName,
        responsible_id: input.responsibleId,
        justification: input.justification.trim(),
        status: 'COMPLETED',
        total_items_checked: totalChecked,
        divergent_items_count: divergentItems.length,
        positive_adjustments_count: positiveAdjustments.length,
        negative_adjustments_count: negativeAdjustments.length,
      })
      .select()
      .single()

    if (sessionError || !sessionData) {
      return { success: false, error: sessionError || new Error('Falha ao criar sessão') }
    }

    const sessionId = sessionData.id

    // 2. Para cada item conferido:
    // Se houver divergência, gerar uma movimentação em inventory_movements
    // e depois vincular na tabela inventory_audit_session_items
    for (const itemInput of input.items) {
      const diff = itemInput.countedQuantity - itemInput.systemQuantity
      let movementId: string | null = null
      let adjustmentType: 'INVENTORY_ADJUST_IN' | 'INVENTORY_ADJUST_OUT' | null = null

      if (diff !== 0) {
        const isPositive = diff > 0
        const absQty = Math.abs(diff)
        adjustmentType = isPositive ? 'INVENTORY_ADJUST_IN' : 'INVENTORY_ADJUST_OUT'

        const reasonText = isPositive
          ? `Ajuste de inventário (Entrada/Sobra: +${diff})`
          : `Ajuste de inventário (Perda/Falta: -${absQty})`

        const noteText = itemInput.notes
          ? `${input.justification} - Obs: ${itemInput.notes}`
          : input.justification

        // Inserir movimentação no estoque real
        const { data: moveData, error: moveError } = await supabase
          .from('inventory_movements')
          .insert({
            item_id: itemInput.itemId,
            type: adjustmentType as any,
            quantity: absQty,
            health_unit_name: input.healthUnitName,
            responsible_id: input.responsibleId,
            observations: noteText,
            special_reason: reasonText,
          } as any)
          .select('id')
          .single()

        if (moveError) {
          console.error('Erro ao gerar movimentação de ajuste:', moveError)
          // Mesmo com erro parcial, registramos o erro para o chamador
          return {
            success: false,
            sessionId,
            error: new Error(`Erro ao aplicar movimentação para item: ${moveError.message}`),
          }
        }

        movementId = moveData?.id || null
      }

      // Registrar o item na sessão de contagem
      const { error: itemInsertError } = await (supabase as any)
        .from('inventory_audit_session_items')
        .insert({
          session_id: sessionId,
          item_id: itemInput.itemId,
          system_quantity: itemInput.systemQuantity,
          counted_quantity: itemInput.countedQuantity,
          difference: diff,
          adjustment_type: adjustmentType,
          movement_id: movementId,
          notes: itemInput.notes || null,
        })

      if (itemInsertError) {
        console.error('Erro ao registrar item da sessão:', itemInsertError)
      }
    }

    return { success: true, sessionId }
  } catch (err: any) {
    return { success: false, error: err }
  }
}
