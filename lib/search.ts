/**
 * Búsqueda segura para ILIKE de PostgREST/Supabase.
 *
 * - Nunca concatenar SQL crudo desde el cliente.
 * - El cliente de Supabase parametriza los filtros; aquí solo saneamos
 *   comodines ILIKE (%, _) y limitamos longitud para evitar abusos.
 */
export function sanitizeSearch(raw: unknown, maxLength = 80): string {
  if (typeof raw !== 'string') return ''

  let q = raw.trim().slice(0, maxLength)

  // Escapar comodines de ILIKE / LIKE
  q = q.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')

  // Quitar caracteres de control
  q = q.replace(/[\u0000-\u001F\u007F]/g, '')

  return q
}

/**
 * Construye un patrón ILIKE contains: %query%
 * Devuelve null si la query queda vacía (el caller no debe filtrar).
 */
export function ilikeContains(raw: unknown): string | null {
  const q = sanitizeSearch(raw)
  if (!q) return null
  return `%${q}%`
}
