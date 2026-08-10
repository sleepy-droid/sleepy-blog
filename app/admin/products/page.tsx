import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { ShoppingBag, PlusCircle, ArrowLeft, ExternalLink } from 'lucide-react'
import { formatPrice, type Product } from '@/lib/types'

export const metadata = {
  title: 'Gestión de Catálogo | Panel Admin sleepyred999',
}

export default async function AdminProductsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: dbProducts } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  const products: Product[] = dbProducts || []

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
              Gestión de Catálogo de Productos
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Administra lanzamientos musicales digital y prendas físicas del catálogo.
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
                <th className="p-4">Categoría</th>
                <th className="p-4">Formato</th>
                <th className="p-4">Precio</th>
                <th className="p-4 text-right">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                        {p.thumbnail_url ? (
                          <Image src={p.thumbnail_url} alt={p.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600">Item</div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-white line-clamp-1">{p.name}</h3>
                        <p className="text-[11px] text-neutral-500 font-mono">
                          {p.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-neutral-900 text-neutral-300 border border-neutral-800 uppercase">
                      {p.category}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                      p.fulfillment === 'digital'
                        ? 'bg-red-950 text-red-400 border-red-800'
                        : 'bg-amber-950 text-amber-400 border-amber-800'
                    }`}>
                      {p.fulfillment === 'digital' ? '🎵 Digital' : '📦 Físico'}
                    </span>
                  </td>

                  <td className="p-4 font-mono font-bold text-red-400">
                    {formatPrice(p.price_cents, p.currency)}
                  </td>

                  <td className="p-4 text-right">
                    <Link
                      href={`/shop/${p.slug || p.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Tienda</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
