/**
 * Community Forum Page: /community
 * File Path: app/community/page.tsx
 */

import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { getAggregateVotesMap, getUserVotesMap } from '@/lib/votes-server'
import { hydrateProductWithFolderAssets } from '@/lib/product-files'
import { CommunityClient } from './CommunityClient'
import { Users, Bell } from 'lucide-react'
import type { Product } from '@/lib/types'

export type TaggedProductSummary = {
  id: string
  name: string
  slug: string
  thumbnail_url?: string | null
  price_cents?: number
}

export type ThreadWithAuthor = {
  id: string
  title: string
  body: string
  image_url: string | null
  youtube_url: string | null
  linked_product_id: string | null
  product_ids?: string[]
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
  products: TaggedProductSummary | null
  linked_products?: TaggedProductSummary[]
}

export function extractThreadProductIds(thread: {
  linked_product_id?: string | null
  product_ids?: string[] | null
  tags?: string[] | null
}): string[] {
  const ids: string[] = []
  const pushId = (val?: string | null) => {
    if (!val) return
    const clean = String(val).trim()
    if (clean && !ids.includes(clean) && ids.length < 3) {
      ids.push(clean)
    }
  }

  if (Array.isArray(thread.product_ids)) {
    for (const pid of thread.product_ids) pushId(pid)
  }
  if (Array.isArray(thread.tags)) {
    for (const tag of thread.tags) {
      if (typeof tag === 'string' && tag.startsWith('__prod:')) {
        pushId(tag.slice('__prod:'.length))
      }
    }
  }
  pushId(thread.linked_product_id)
  return ids
}

export function extractCleanThreadTags(rawTags?: string[] | null): string[] {
  if (!Array.isArray(rawTags)) return []
  return rawTags.filter((t) => typeof t === 'string' && !t.startsWith('__prod:'))
}

export default async function CommunityPage() {
  const supabase = await createClient()
  const currentUser = await getCurrentUser()

  // Fetch real visible threads and published products from Supabase
  const [{ data: rawThreads }, { data: productsData }] = await Promise.all([
    supabase
      .from('forum_threads')
      .select('*')
      .eq('status', 'visible')
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
  ])

  const threadRows = rawThreads || []
  const threadIds = threadRows.map((t) => String(t.id))

  const authorIds = Array.from(
    new Set(threadRows.map((t) => t.author_id).filter(Boolean))
  )

  const [profilesRes, honestVotesMap, userVotesMap] = await Promise.all([
    authorIds.length > 0
      ? supabase
        .from('profiles')
        .select('id, display_name, email, username, avatar_url')
        .in('id', authorIds)
      : Promise.resolve({ data: [] }),
    getAggregateVotesMap({
      supabase,
      targetType: 'forum_thread',
      targetIds: threadIds,
    }),
    getUserVotesMap({
      supabase,
      userId: currentUser?.id,
      targetType: 'forum_thread',
      targetIds: threadIds,
    }),
  ])

  const profileMap = new Map<
    string,
    {
      display_name: string | null
      email: string | null
      username: string | null
      avatar_url: string | null
    }
  >()

    for (const p of profilesRes.data || []) {
      profileMap.set(p.id, {
        display_name: p.display_name,
        email: p.email,
        username: p.username,
        avatar_url: p.avatar_url,
      })
    }

        const productMap = new Map<string, TaggedProductSummary>()
  const hydratedCatalog = ((productsData || []) as Product[]).map((p) =>
          hydrateProductWithFolderAssets(p)
        )

  for(const pr of hydratedCatalog) {
          const summary: TaggedProductSummary = {
            id: pr.id,
            name: pr.name,
            slug: pr.slug,
            thumbnail_url: pr.thumbnail_url,
      price_cents: pr.price_cents,
    }
    productMap.set(pr.id, summary)
    if (pr.slug) productMap.set(pr.slug, summary)
  }

  // Sync any thread in DB that still has old placeholder upvotes (e.g., 1 when actual votes = 0)
  for (const t of threadRows) {
    const real = honestVotesMap[String(t.id)] || { upvotes: 0, downvotes: 0 }
    if (t.upvotes !== real.upvotes || (t.downvotes ?? 0) !== real.downvotes) {
      supabase
        .from('forum_threads')
        .update({ upvotes: real.upvotes, downvotes: real.downvotes })
        .eq('id', t.id)
        .then(() => { })
    }
  }

    const threads: ThreadWithAuthor[] = threadRows.map((t) => {
      const realVotes = honestVotesMap[String(t.id)] || { upvotes: 0, downvotes: 0 }
      const pIds = extractThreadProductIds(t)
      const linkedProducts = pIds
        .map((pid) => productMap.get(pid))
        .filter((p): p is TaggedProductSummary => Boolean(p))
        .slice(0, 3)

      return {
        ...t,
        tags: extractCleanThreadTags(t.tags),
        product_ids: pIds,
        upvotes: realVotes.upvotes,
        downvotes: realVotes.downvotes,
        profiles: profileMap.get(t.author_id) || null,
        products: linkedProducts[0] || null,
        linked_products: linkedProducts,
      }
    })

  const productsList = hydratedCatalog.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price_cents: p.price_cents,
      thumbnail_url: p.thumbnail_url ?? undefined,
    }))

  return(
    <main className = "max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10 font-sans" >
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

      {/* Interactive Forum Thread Creator and Thread Feed */ }
      <CommunityClient
        threads = { threads }
        products = { productsList }
        currentUser = { currentUser }
        initialUserVotes = { userVotesMap }
        />

        {/* Discord Banner */ }
        < div className = "p-6 rounded-2xl border border-red-950/50 bg-gradient-to-r from-red-950/30 via-neutral-950 to-neutral-900/40 text-center space-y-3 shadow-xl" >
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
      </div >
    </main >
  )
}
