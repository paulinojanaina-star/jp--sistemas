import { Item } from '@/types/inventory'
import { formatItemDisplay } from '@/utils/itemFormat'

function normalizeName(name: string): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '') // Remove spaces and punctuation
}

export function getPotentialDuplicateIds(items: Item[]): Set<string> {
  const normalizedMap = new Map<string, string[]>()

  items.forEach((item) => {
    const formatted = formatItemDisplay(item)
    const normalized = normalizeName(formatted)

    if (!normalized) return

    if (!normalizedMap.has(normalized)) {
      normalizedMap.set(normalized, [])
    }
    normalizedMap.get(normalized)!.push(item.id)
  })

  const duplicateIds = new Set<string>()

  normalizedMap.forEach((ids) => {
    if (ids.length > 1) {
      ids.forEach((id) => duplicateIds.add(id))
    }
  })

  return duplicateIds
}
