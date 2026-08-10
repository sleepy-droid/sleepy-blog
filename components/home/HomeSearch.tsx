import { Search } from 'lucide-react'

/**
 * Barra de búsqueda del feed.
 * Usa GET ?q= — el Server Component sanea con sanitizeSearch (sin SQL crudo).
 */
export function HomeSearch({ defaultValue = '' }: { defaultValue?: string }) {
  return (
    <form action="/" method="get" className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        maxLength={80}
        placeholder="Buscar en la bitácora…"
        className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-700/60 focus:ring-2 focus:ring-red-900/40"
      />
    </form>
  )
}
