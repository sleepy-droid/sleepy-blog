/**
 * Community Forum Page: /community
 * File Path: app/community/page.tsx
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

  // Fetch real visible threads from Supabase without failing if FK to profiles is missing
  const [{ data: rawThreads }, { data: productsData }] = await Promise.all([
    supabase
      .from('forum_threads')
      .select('*')
      .eq('status', 'visible')
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, name, slug, price_cents, thumbnail_url')
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
  ])

  const authorIds = Array.from(
    new Set((rawThreads || []).map((t) => t.author_id).filter(Boolean))
  )

  const profileMap = new Map<
    string,
    {
      display_name: string | null
      email: string | null
      username: string | null
      avatar_url: string | null
    }
  >()

  if (authorIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, display_name, email, username, avatar_url')
      .in('id', authorIds)

    for (const p of profilesData || []) {
      profileMap.set(p.id, {
        display_name: p.display_name,
        email: p.email,
        username: p.username,
        avatar_url: p.avatar_url,
      })
    }
  }

  const productMap = new Map<
    string,
    { name: string; slug: string; thumbnail_url?: string | null }
  >()
  for (const pr of productsData || []) {
    productMap.set(pr.id, {
      name: pr.name,
      slug: pr.slug,
      thumbnail_url: pr.thumbnail_url,
    })
  }

  const threads: ThreadWithAuthor[] = (rawThreads || []).map((t) => ({
    ...t,
    profiles: profileMap.get(t.author_id) || null,
    products: t.linked_product_id ? productMap.get(t.linked_product_id) || null : null,
  }))

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
