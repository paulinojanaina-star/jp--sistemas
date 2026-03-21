export function formatItemDisplay(item: { name?: string; id?: string } | undefined | null): string {
  if (!item || !item.name) return 'Desconhecido'
  return item.name.trim()
}
