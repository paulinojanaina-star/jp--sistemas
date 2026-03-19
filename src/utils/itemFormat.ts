export function formatItemDisplay(item: { name?: string; id?: string } | undefined | null): string {
  if (!item) return 'Desconhecido'
  const name = item.name || 'Desconhecido'
  if (!item.id) return name
  const shortId = item.id.split('-')[0].toUpperCase()
  return `${name} (${shortId})`
}
