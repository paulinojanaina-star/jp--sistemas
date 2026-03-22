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

export function getDuplicateGroups(items: Item[]): Item[][] {
  const normalizedMap = new Map<string, Item[]>()

  items.forEach((item) => {
    const formatted = formatItemDisplay(item)
    const normalized = normalizeName(formatted)

    if (!normalized) return

    if (!normalizedMap.has(normalized)) {
      normalizedMap.set(normalized, [])
    }
    normalizedMap.get(normalized)!.push(item)
  })

  return Array.from(normalizedMap.values()).filter((group) => group.length > 1)
}

export function getPotentialDuplicateIds(items: Item[]): Set<string> {
  const duplicateIds = new Set<string>()
  const groups = getDuplicateGroups(items)

  groups.forEach((group) => {
    group.forEach((item) => duplicateIds.add(item.id))
  })

  return duplicateIds
}
