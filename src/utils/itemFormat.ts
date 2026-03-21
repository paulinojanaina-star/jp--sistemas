export function formatItemDisplay(item: { name?: string; id?: string } | undefined | null): string {
  if (!item) return 'Desconhecido'
  return item.name || 'Desconhecido'
}
