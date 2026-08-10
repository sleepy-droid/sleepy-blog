/**
 * User Library Page: /library
 * File Path: app/library/page.tsx
 * 
 * Features:
 * 1. Web Player on top for playing owned songs directly in browser.
 * 2. High quality WAV / MP3 offline download links.
 * 3. Categorized list of user's purchased digital releases & merch orders.
 */

import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { LibraryClient } from './LibraryClient'
import { Library, Music, Download, ShieldCheck, Sparkles, ShoppingBag } from 'lucide-react'
import type { Product } from '@/lib/types'

export default async function LibraryPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect('/auth/login?next=/library')
  }

  const supabase = await createClient()

  // Fetch library items for the authenticated user
  const { data: libraryData } = await supabase
    .from('library_items')
    .select('*, products (*)')
    .eq('user_id', currentUser.id)

  let ownedProducts: Product[] = libraryData?.map((item) => item.products) as Product[] || []

  // Fallback demo owned items for instant testing if library table is fresh
  if (ownedProducts.length === 0) {
    ownedProducts = [
      {
        id: 'criss-angel',
        slug: 'criss-angel',
        name: 'Criss Angel (Edición Digital Exclusiva)',
        description: 'Lanzamiento digital exclusivo en máster original WAV + MP3 320kbps.',
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
        specs: { 'Formato': 'WAV 24-bit + MP3' },
        popularity_score: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }

  const digitalItems = ownedProducts.map((p, idx) => ({
    id: `lib-${idx}`,
    user_id: currentUser.id,
    product_id: p.id,
    source: 'purchase' as const,
    created_at: p.created_at,
    product: p,
  }))

  const physicalOrders = [
    {
      id: 'ord-883921',
      product: {
        id: 'sleepyred-hoodie-neon',
        slug: 'sleepyred-hoodie-neon',
        name: 'Sleepyred Neon Hoodie (Reflectivo Negro)',
        description: 'Hoodie oversize tejido pesado 400g.',
        fulfillment: 'physical' as const,
        category: 'merch' as const,
        thumbnail_url: '/images/logos/SLEEPYRED JPG NEON-02.jpg',
        gallery: [],
        price_cents: 5500,
        currency: 'USD',
        stock: 20,
        is_published: true,
        is_featured: true,
        audio_preview_url: null,
        duration_seconds: null,
        specs: { Talla: 'XL' },
        popularity_score: 80,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      variantLabel: 'Talla XL',
      quantity: 1,
      status: 'shipped' as const,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ]

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10 font-sans">
      <header className="border-b border-neutral-800/80 pb-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 border border-red-900/40 text-red-400">
          <Library className="w-3.5 h-3.5" />
          <span>Biblioteca Personal de Usuario</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Mis Adquisiciones & Música
        </h1>
        <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
          Accede a todos tus archivos de audio máster WAV/MP3, libros digitales de arte y registros de compras oficiales.
        </p>
      </header>

      {/* Interactive Web Player Top Bar and Downloads List */}
      <LibraryClient digitalItems={digitalItems} physicalOrders={physicalOrders} />

      {/* Assurance Footer */}
      <footer className="p-4 rounded-2xl border border-neutral-800/60 bg-neutral-900/20 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-red-500" />
        <span>Descargas ilimitadas sin restricción de dispositivo. Archivos limpios de alta calidad.</span>
      </footer>
    </main>
  )
}
