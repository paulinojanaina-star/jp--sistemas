import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Item, Movement } from '@/types/inventory'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

interface InventoryContextType {
  items: Item[]
  movements: Movement[]
  loading: boolean
  refreshData: () => Promise<void>
  addItem: (
    item: Omit<Item, 'id' | 'created_at' | 'current_quantity'>,
    initialQty: number,
  ) => Promise<{ error?: any }>
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
    const { data, error } = await supabase.from('items').select('*').order('name')
    if (!error && data) setItems(data)
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
    if (session) {
      refreshData()
    } else {
      setItems([])
      setMovements([])
    }
  }, [session])

  const addItem = async (
    item: Omit<Item, 'id' | 'created_at' | 'current_quantity'>,
    initialQty: number,
  ) => {
    const { data, error } = await supabase
      .from('items')
      .insert({
        name: item.name,
        description: item.description,
        category: item.category,
        unit_type: item.unit_type,
        min_quantity: item.min_quantity,
        current_quantity: 0,
      })
      .select()
      .single()

    if (error) return { error }

    if (initialQty > 0 && session?.user.id) {
      await addMovement({
        item_id: data.id,
        type: 'IN',
        quantity: initialQty,
        health_unit_name: 'Estoque Inicial',
        responsible_id: session.user.id,
        observations: 'Cadastro inicial',
      })
    } else {
      await fetchItems()
    }

    return {}
  }

  const addMovement = async (
    movement: Omit<Movement, 'id' | 'created_at' | 'items' | 'profiles'>,
  ) => {
    const { error } = await supabase.from('inventory_movements').insert(movement)
    if (error) return { error }

    // Refresh data to reflect new stock amounts and history
    await refreshData()
    return {}
  }

  return (
    <InventoryContext.Provider
      value={{ items, movements, loading, refreshData, addItem, addMovement }}
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
