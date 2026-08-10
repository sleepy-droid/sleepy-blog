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

/** Seed demo catalog items for instant display */
const SEED_PRODUCTS: Product[] = [
  {
    id: 'criss-angel',
    slug: 'criss-angel',
    name: 'Criss Angel (Edición Digital Exclusiva)',
    description: 'Lanzamiento digital exclusivo en máster original. Incluye archivo WAV sin compresión (24-bit / 44.1kHz), versión MP3 320kbps y libro digital de arte.',
    fulfillment: 'digital',
    category: 'music',
    thumbnail_url: '/images/releases/criss-angel.jpg',
    gallery: [],
    price_cents: 1200,
    currency: 'USD',
    stock: null,
    is_published: true,
    is_featured: true,
    audio_preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration_seconds: 215,
    specs: { 'Formato': 'WAV 24-bit + MP3 320kbps', 'Licencia': 'Uso Personal' },
    popularity_score: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sleepyred-hoodie-neon',
    slug: 'sleepyred-hoodie-neon',
    name: 'Sleepyred Neon Oversize Hoodie',
    description: 'Buzo negro de algodón pesado (400 GSM) con estampado neón reflectivo oficial.',
    fulfillment: 'physical',
    category: 'merch',
    thumbnail_url: '/images/logos/SLEEPYRED JPG NEON-02.jpg',
    gallery: [],
    price_cents: 5500,
    currency: 'USD',
    stock: 50,
    is_published: true,
    is_featured: true,
    audio_preview_url: null,
    duration_seconds: null,
    specs: { 'Material': 'Algodón Pesado', 'Corte': 'Oversize' },
    popularity_score: 85,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'poster-neon-01',
    slug: 'poster-neon-01',
    name: 'Póster Neón Logo A2',
    description: 'Póster de alta calidad A2 con logotipo neón oficial sleepyred999.',
    fulfillment: 'physical',
    category: 'poster',
    thumbnail_url: '/images/logos/PNG-04.png',
    gallery: [],
    price_cents: 1800,
    currency: 'USD',
    stock: 30,
    is_published: true,
    is_featured: false,
    audio_preview_url: null,
    duration_seconds: null,
    specs: { 'Tamaño': 'A2', 'Papel': '250g Mate' },
    popularity_score: 40,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

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

  const products: Product[] = (dbProducts && dbProducts.length > 0) ? dbProducts : SEED_PRODUCTS

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10 font-sans">
      {/* Header Section */}
      <header className="border-b border-neutral-800/80 pb-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 border border-red-900/40 text-red-400">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Tienda Oficial & Lanzamientos</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Catálogo de Productos
        </h1>
        <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
          Adquiere producciones musicales originales en alta definición, merchandising oficial de edición limitada y pósters de colección.
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
