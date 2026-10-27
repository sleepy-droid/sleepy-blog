/**
 * Storefront Catalog Page: /shop
 * File Path: app/shop/page.tsx
 */

import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { getUserVotesMap } from '@/lib/votes-server'
import { type Product } from '@/lib/types'
import { ShopClient } from './ShopClient'
import { ShoppingBag, ShieldCheck } from 'lucide-react'

type ShopPageProps = {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const currentUser = await getCurrentUser()

  // Fetch products from database
  const { data: dbProducts } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const products: Product[] = dbProducts ?? []

  const userVotes = await getUserVotesMap({
    supabase,
    userId: currentUser?.id,
    targetType: 'product',
    targetIds: products.map((p) => p.id),
  })

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4 font-sans">
      {/* Compact Header Section */}
      <header className="border-b border-neutral-800/80 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-950/60 border border-red-900/40 text-red-400">
            <ShoppingBag className="w-3 h-3" />
            <span>Tienda Oficial & Lanzamientos</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mt-1">
            Catálogo de Productos
          </h1>
        </div>
        <p className="text-xs text-neutral-400 max-w-md hidden sm:block text-right">
          Música máster sin compresión y merchandising oficial.
        </p>
      </header>

      {/* Interactive Client Search, Filters & Aspect 4:3 Grid */}
      <ShopClient
        initialProducts={products}
        initialQuery={params.q || ''}
        userVotes={userVotes}
      />

      {/* Footer Assurance */}
      <footer className="p-4 rounded-2xl border border-neutral-800/60 bg-neutral-900/20 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-red-500" />
        <span>Pagos cifrados y seguros. Descargas inmediatas para productos digitales y envíos garantizados.</span>
      </footer>
    </main>
  )
}
