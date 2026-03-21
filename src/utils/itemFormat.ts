export function formatItemDisplay(item: { name?: string; id?: string } | undefined | null): string {
  if (!item || !item.name) return 'Desconhecido'
  // Removes trailing parenthesized alphanumeric codes like "(4139) (3B86587F)"
  return item.name.replace(/(?:\s*\([A-Za-z0-9-]+\))+$/g, '').trim()
}
