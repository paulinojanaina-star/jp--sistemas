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
  deleteItem: (id: string) => Promise<{ error?: any }>
  addMovement: (
    movement: Omit<Movement, 'id' | 'created_at' | 'items' | 'profiles'>,
  ) => Promise<{ error?: any }>
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
    let formattedName = item.name
    const match = formattedName.match(/^(\d+)\s+(.*)$/)
    if (match) {
      formattedName = `${match[2].trim()} (${match[1]})`
    }

    const { data, error } = await supabase
      .from('items')
      .insert({
        name: formattedName,
        description: item.description,
        unit_type: item.unit_type,
        min_quantity: item.min_quantity,
        current_quantity: 0,
      })
      .select()
      .single()

    if (error) return { error }

    if (initialQty > 0 && session?.user?.id) {
      const { error: moveError } = await addMovement({
        item_id: data.id,
        type: 'IN',
        quantity: initialQty,
        health_unit_name: 'Estoque Inicial',
        responsible_id: session.user.id,
        observations: 'Cadastro inicial',
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
      const match = payload.name.match(/^(\d+)\s+(.*)$/)
      if (match) {
        payload.name = `${match[2].trim()} (${match[1]})`
      }
    }

    const { error } = await supabase.from('items').update(payload).eq('id', id)
    if (error) return { error }
    await refreshData()
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
    const { error } = await supabase.from('inventory_movements').insert(movement)
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
        deleteItem,
        addMovement,
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
