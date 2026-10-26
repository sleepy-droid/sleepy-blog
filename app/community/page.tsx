/**
 * Community Forum Page: /community
 * File Path: app/community/page.tsx
 *
 * Features (v1.0):
 * 1. Multi-user thread creation (title, body, optional image).
 * 2. Original song/product metadata tagging (remixes, vocal covers, etc.).
 * 3. YouTube video embed support (`iframe` player).
 * 4. Real database community threads & products (placeholder demo threads removed).
 */

import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { CommunityClient } from './CommunityClient'
import { Users, Bell } from 'lucide-react'

export type ThreadWithAuthor = {
  id: string
  title: string
  body: string
  image_url: string | null
  youtube_url: string | null
  linked_product_id: string | null
  tags?: string[]
  upvotes?: number
  downvotes?: number
  created_at: string
  author_id: string
  profiles: {
    display_name: string | null
    email: string | null
    username: string | null
    avatar_url: string | null
  } | null
  products: {
    name: string
    slug: string
    thumbnail_url?: string | null
  } | null
}

export default async function CommunityPage() {
  const supabase = await createClient()
  const currentUser = await getCurrentUser()

  // Fetch real visible threads from Supabase
  const { data: threadsData } = await supabase
    .from('forum_threads')
    .select('*, profiles:author_id (display_name, email, username, avatar_url), products:linked_product_id (name, slug, thumbnail_url)')
    .eq('status', 'visible')
    .order('created_at', { ascending: false })

  const threads: ThreadWithAuthor[] = (threadsData as ThreadWithAuthor[]) || []

  // Fetch real published products for tagging selector
  const { data: productsData } = await supabase
    .from('products')
    .select('id, name, slug, price_cents, thumbnail_url')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const productsList = (productsData || []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price_cents: p.price_cents,
    thumbnail_url: p.thumbnail_url ?? undefined,
  }))

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10 font-sans">
      <header className="border-b border-neutral-800/80 pb-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 border border-red-900/40 text-red-400">
          <Users className="w-3.5 h-3.5" />
          <span>Espacio de la Comunidad</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Foro & Debates
        </h1>
        <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
          Comparte tus producciones, remixes con muestras oficiales, dudas sobre merchandising y conecta con otros seguidores de sleepyred999.
        </p>
      </header>

      {/* Interactive Forum Thread Creator and Thread Feed */}
      <CommunityClient
        threads={threads}
        products={productsList}
        currentUser={currentUser}
      />

      {/* Discord Banner */}
      <div className="p-6 rounded-2xl border border-red-950/50 bg-gradient-to-r from-red-950/30 via-neutral-950 to-neutral-900/40 text-center space-y-3 shadow-xl">
        <Bell className="w-6 h-6 text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-white">Servidor Oficial de Discord</h3>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          Únete al servidor oficial para recibir alertas de drops directos y conversar en vivo con otros miembros.
        </p>
        <a
          href="https://discord.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg"
        >
          <span>Unirse al Discord Oficial</span>
        </a>
      </div>
    </main>
  )
}
