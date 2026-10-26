import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { ShoppingBag, PlusCircle, ArrowLeft, ExternalLink, FolderOpen, HardDrive } from 'lucide-react'
import { formatPrice, type Product } from '@/lib/types'
import { getProductFolderStats } from '@/lib/product-files'

export const metadata = {
  title: 'Gestión de Catálogo | Panel Admin sleepyred999 v1.0',
}

export default async function AdminProductsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: dbProducts } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  const products: Product[] = (dbProducts || []).map((p) => ({
    ...p,
    folder_stats: getProductFolderStats(p),
  }))

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-red-500" />
              Gestión de Catálogo & Directorios CDN (v1.0)
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Administra lanzamientos musicales digitales, carpetas de másters WAV/Acapella y prendas físicas.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-all shadow-md cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Nuevo Producto</span>
        </Link>
      </header>

      <div className="border border-neutral-800/80 rounded-2xl bg-neutral-950 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60 font-mono text-neutral-400 uppercase tracking-wider">
                <th className="p-4">Producto</th>
                <th className="p-4">Directorio / Peso CDN</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Formato</th>
                <th className="p-4">Precio</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {products.map((p) => {
                const stats = p.folder_stats
                const baseDir = p.category === 'music' || p.fulfillment === 'digital' ? 'songs' : 'merch'
                const expectedDir = p.storage_folder_path || `${baseDir}/${p.slug}`

                return (
                  <tr key={p.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                          {p.thumbnail_url ? (
                            <Image src={p.thumbnail_url} alt={p.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600">
                              Item
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-white line-clamp-1">{p.name}</h3>
                          <p className="text-[11px] text-neutral-500 font-mono">
                            ID: #{p.id.slice(0, 8)} • {p.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono">
                      {stats ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                            <FolderOpen className="w-3.5 h-3.5" /> /{stats.folderPath}
                          </span>
                          <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                            <HardDrive className="w-3 h-3 text-red-400" />
                            <span>
                              {stats.totalSizeFormatted} ({stats.filesCount} archivos)
                            </span>
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                            <FolderOpen className="w-3.5 h-3.5 text-neutral-600" /> /{expectedDir}
                          </span>
                          <p className="text-[10px] text-neutral-600">Se sincroniza al guardar</p>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-neutral-900 text-neutral-300 border border-neutral-800 uppercase">
                        {p.category}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                          p.fulfillment === 'digital'
                            ? 'bg-red-950 text-red-400 border-red-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}
                      >
                        {p.fulfillment === 'digital' ? '🎵 Digital' : '📦 Físico'}
                      </span>
                    </td>

                    <td className="p-4 font-mono font-bold text-red-400">
                      {formatPrice(p.price_cents, p.currency)}
                    </td>

                    <td className="p-4 text-right space-x-2">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-950 text-red-300 hover:bg-red-900 border border-red-800 transition-colors font-bold"
                      >
                        <span>Editar / Subir</span>
                      </Link>

                      <Link
                        href={`/shop/${p.slug || p.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ver</span>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
