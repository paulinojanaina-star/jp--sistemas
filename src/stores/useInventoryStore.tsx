import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Item, Movement } from '@/types/inventory'

interface InventoryContextType {
  items: Item[]
  movements: Movement[]
  addItem: (item: Omit<Item, 'id'>) => void
  updateItem: (id: string, item: Partial<Item>) => void
  addMovement: (movement: Omit<Movement, 'id'>) => void
}

export const InventoryContext = createContext<InventoryContextType | null>(null)

const today = new Date().toISOString().split('T')[0]
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0]

const initialItems: Item[] = [
  {
    id: '1',
    name: 'Dipirona 500mg',
    description: 'Comprimidos',
    category: 'Medicação',
    unit: 'Caixa',
    minStock: 50,
    currentStock: 120,
  },
  {
    id: '2',
    name: 'Seringa 5ml',
    description: 'Descartável s/ agulha',
    category: 'Consumíveis',
    unit: 'Unidade',
    minStock: 200,
    currentStock: 150,
  },
  {
    id: '3',
    name: 'Luvas de Procedimento P',
    description: 'Látex',
    category: 'EPI',
    unit: 'Caixa',
    minStock: 20,
    currentStock: 45,
  },
  {
    id: '4',
    name: 'Máscara N95',
    description: 'Respirador PFF2',
    category: 'EPI',
    unit: 'Unidade',
    minStock: 100,
    currentStock: 10,
  },
  {
    id: '5',
    name: 'Soro Fisiológico 0.9%',
    description: '500ml',
    category: 'Medicação',
    unit: 'Frasco',
    minStock: 150,
    currentStock: 300,
  },
]

const initialMovements: Movement[] = [
  {
    id: 'm1',
    itemId: '1',
    type: 'ENTRADA',
    quantity: 100,
    date: twoDaysAgo,
    responsible: 'Ana Silva',
    unitOriginDest: 'Almoxarifado Central',
    observation: 'Reposição mensal',
  },
  {
    id: 'm2',
    itemId: '4',
    type: 'SAIDA',
    quantity: 50,
    date: yesterday,
    responsible: 'Carlos Mendes',
    unitOriginDest: 'UTI Adulto',
    observation: 'Uso emergencial',
  },
  {
    id: 'm3',
    itemId: '2',
    type: 'SAIDA',
    quantity: 30,
    date: today,
    responsible: 'Ana Silva',
    unitOriginDest: 'Pronto Socorro',
  },
  {
    id: 'm4',
    itemId: '3',
    type: 'ENTRADA',
    quantity: 20,
    date: today,
    responsible: 'João Pedro',
    unitOriginDest: 'Fornecedor Externo',
  },
]

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [movements, setMovements] = useState<Movement[]>(initialMovements)

  const addItem = (item: Omit<Item, 'id'>) => {
    setItems((prev) => [...prev, { ...item, id: Math.random().toString(36).substring(2, 9) }])
  }

  const updateItem = (id: string, updated: Partial<Item>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)))
  }

  const addMovement = (movement: Omit<Movement, 'id'>) => {
    const newMovement = { ...movement, id: Math.random().toString(36).substring(2, 9) }
    setMovements((prev) => [newMovement, ...prev])

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === movement.itemId) {
          const newStock =
            movement.type === 'ENTRADA'
              ? item.currentStock + movement.quantity
              : item.currentStock - movement.quantity
          return { ...item, currentStock: newStock }
        }
        return item
      }),
    )
  }

  return (
    <InventoryContext.Provider value={{ items, movements, addItem, updateItem, addMovement }}>
      {children}
    </InventoryContext.Provider>
  )
}

export const useInventoryStore = () => {
  const context = useContext(InventoryContext)
  if (!context) throw new Error('useInventoryStore must be used within InventoryProvider')
  return context
}
