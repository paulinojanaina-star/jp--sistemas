import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Item, Movement } from '@/types/inventory'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { formatItemDisplay } from '@/utils/itemFormat'

interface InventoryContextType {
  items: Item[]
  movements: Movement[]
  loading: boolean
  refreshData: () => Promise<void>
  addItem: (
    item: Omit<Item, 'id' | 'created_at' | 'current_quantity'>,
    initialQty: number,
    movementData?: {
      batch_number?: string | null
      manufacturing_date?: string | null
      expiry_date?: string | null
    },
  ) => Promise<{ error?: any }>
  updateItem: (id: string, updates: Partial<Item>) => Promise<{ error?: any }>
  updateItemBatchInfo: (
    itemId: string,
    batchData: {
      batch_number?: string | null
      manufacturing_date?: string | null
      expiry_date?: string | null
    },
  ) => Promise<{ error?: any }>
  deleteItem: (id: string) => Promise<{ error?: any }>
  addMovement: (
    movement: Omit<Movement, 'id' | 'created_at' | 'items' | 'profiles'>,
  ) => Promise<{ error?: any }>
  updateMovement: (id: string, updates: Partial<Movement>) => Promise<{ error?: any }>
  mergeItems: (sourceId: string, destinationId: string) => Promise<{ error?: any }>
}

export const InventoryContext = createContext<InventoryContextType | null>(null)

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = async () => {
    const { data, error } = await supabase.from('items').select('*')
    if (!error && data) {
      const sortedData = data.sort((a, b) =>
        formatItemDisplay(a).localeCompare(formatItemDisplay(b), 'pt-BR'),
      )
      setItems(sortedData)
    }
  }

  const fetchMovements = async () => {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*, items(name), profiles(email, full_name)')
      .order('created_at', { ascending: false })
    if (!error && data) setMovements(data)
  }

  const refreshData = async () => {
    setLoading(true)
    await Promise.all([fetchItems(), fetchMovements()])
    setLoading(false)
  }

  useEffect(() => {
    if (session?.user?.id) {
      refreshData()
    } else {
      setItems([])
      setMovements([])
    }
  }, [session?.user?.id])

  const addItem = async (
    item: Omit<Item, 'id' | 'created_at' | 'current_quantity'>,
    initialQty: number,
    movementData?: {
      batch_number?: string | null
      manufacturing_date?: string | null
      expiry_date?: string | null
    },
  ) => {
    const { data, error } = await supabase
      .from('items')
      .insert({
        name: item.name.trim(),
        description: item.description,
        unit_type: item.unit_type,
        min_quantity: item.min_quantity,
        supplier: item.supplier,
        current_quantity: 0,
      })
      .select()
      .single()

    if (error) return { error }

    const hasBatchData =
      movementData?.batch_number || movementData?.manufacturing_date || movementData?.expiry_date

    if ((initialQty > 0 || hasBatchData) && session?.user?.id) {
      const { error: moveError } = await addMovement({
        item_id: data.id,
        type: 'IN',
        quantity: initialQty,
        health_unit_name: 'Estoque Inicial',
        responsible_id: session.user.id,
        observations: initialQty > 0 ? 'Cadastro inicial' : 'Registro de lote/validade inicial',
        batch_number: movementData?.batch_number,
        manufacturing_date: movementData?.manufacturing_date,
        expiry_date: movementData?.expiry_date,
      })
      if (moveError) return { error: moveError }
    } else {
      await fetchItems()
    }

    return {}
  }

  const updateItem = async (id: string, updates: Partial<Item>) => {
    const payload = { ...updates }
    if (payload.name) {
      payload.name = payload.name.trim()
    }

    const { error } = await supabase.from('items').update(payload).eq('id', id)
    if (error) return { error }
    await refreshData()
    return {}
  }

  const updateItemBatchInfo = async (
    itemId: string,
    batchData: {
      batch_number?: string | null
      manufacturing_date?: string | null
      expiry_date?: string | null
    },
  ) => {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('id')
      .eq('item_id', itemId)
      .eq('type', 'IN')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) return { error }

    if (data && data.length > 0) {
      const { error: updateError } = await supabase
        .from('inventory_movements')
        .update(batchData)
        .eq('id', data[0].id)
      if (updateError) return { error: updateError }
      await refreshData()
      return {}
    }

    // Se não tem movimentação de entrada, cria uma zerada para armazenar lote/validade
    if (batchData.batch_number || batchData.manufacturing_date || batchData.expiry_date) {
      if (session?.user?.id) {
        const { error: moveError } = await addMovement({
          item_id: itemId,
          type: 'IN',
          quantity: 0,
          health_unit_name: 'Ajuste de Validade',
          responsible_id: session.user.id,
          observations: 'Ajuste automático para registro de lote/validade',
          batch_number: batchData.batch_number,
          manufacturing_date: batchData.manufacturing_date,
          expiry_date: batchData.expiry_date,
        })
        if (moveError) return { error: moveError }
        return {}
      }
    }

    return {}
  }

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) return { error }
    await refreshData()
    return {}
  }

  const addMovement = async (
    movement: Omit<Movement, 'id' | 'created_at' | 'items' | 'profiles'>,
  ) => {
    const { error } = await supabase.from('inventory_movements').insert(movement as any)
    if (error) return { error }
    await refreshData()
    return {}
  }

  const updateMovement = async (id: string, updates: Partial<Movement>) => {
    const { error } = await supabase
      .from('inventory_movements')
      .update(updates as any)
      .eq('id', id)
    if (error) return { error }
    await refreshData()
    return {}
  }

  const mergeItems = async (sourceId: string, destinationId: string) => {
    const { error } = await supabase.rpc('merge_items' as any, {
      source_item_id: sourceId,
      destination_item_id: destinationId,
    })
    if (error) return { error }
    await refreshData()
    return {}
  }

  return (
    <InventoryContext.Provider
      value={{
        items,
        movements,
        loading,
        refreshData,
        addItem,
        updateItem,
        updateItemBatchInfo,
        deleteItem,
        addMovement,
        updateMovement,
        mergeItems,
      }}
    >
      {children}
    </InventoryContext.Provider>
  )
}

export const useInventoryStore = () => {
  const context = useContext(InventoryContext)
  if (!context) throw new Error('useInventoryStore must be used within InventoryProvider')
  return context
}
