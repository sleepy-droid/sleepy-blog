/**
 * Storefront Catalog Page: /shop
 * File Path: app/shop/page.tsx
 * 
 * Implemented according to prompt requirements:
 * 1. Uses '/shop' route (audited, no '/productos' or '/products' mismatch).
 * 2. Boxed cards with 4:3 vertical aspect ratio showing song/product title.
 * 3. Clear distinction between Music (Digital Releases) vs Physical Merch & Posters.
 * 4. SQL Injection proof search bar input (sanitized query).
 * 5. Filter tabs (Música, Merch, Populares, Recientes).
 * 6. Navigation to single product detail page (`/shop/[id]`).
 */

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { formatPrice, type Product } from '@/lib/types'
import { ShopClient } from './ShopClient'
import { ShoppingBag, Sparkles, Music, ShieldCheck, Tag } from 'lucide-react'

type ShopPageProps = {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch products from database
  const { data: dbProducts } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const products: Product[] = dbProducts ?? []

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
      <ShopClient initialProducts={products} initialQuery={params.q || ''} />

      {/* Footer Assurance */}
      <footer className="p-4 rounded-2xl border border-neutral-800/60 bg-neutral-900/20 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-red-500" />
        <span>Pagos cifrados y seguros. Descargas inmediatas para productos digitales y envíos garantizados.</span>
      </footer>
    </main>
  )
}
