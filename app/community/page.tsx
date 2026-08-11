/**
 * Community Forum Page: /community
 * File Path: app/community/page.tsx
 * 
 * Features:
 * 1. Multi-user thread creation (title, body, optional image).
 * 2. Original song/product metadata tagging (remixes, vocal covers, etc.).
 * 3. YouTube video embed support (`iframe` player).
 * 4. List of active community threads with replies & badges.
 */

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { CommunityClient } from './CommunityClient'
import { Users, MessageSquare, Flame, Bell, Tag, Video, PlusCircle } from 'lucide-react'

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

const DEMO_THREADS: ThreadWithAuthor[] = [
  {
    id: 'demo-thread-1',
    title: 'Remix Oficial de Vocales Acapella (Criss Angel Remix)',
    body: 'Adquirí los derechos de la voz acapella en la tienda oficial y preparé este remix estilo Synthwave neón. ¡Espero sus opiniones!',
    image_url: '/images/releases/criss-angel.jpg',
    youtube_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    linked_product_id: 'criss-angel',
    created_at: new Date().toISOString(),
    author_id: 'demo-user-1',
    profiles: {
      display_name: 'cyber_producer',
      email: 'cyber@example.com',
      username: 'cyber_producer',
      avatar_url: null
    },
    products: {
      name: 'Criss Angel (Edición Digital)',
      slug: 'criss-angel'
    }
  },
  {
    id: 'demo-thread-2',
    title: '¿Cuándo llega el próximo restock de los Hoodies Neón?',
    body: 'Conseguí el póster A2 y la calidad del papel es increíble. Quisiera saber si habrá más tallas L en el buzón negro reflectivo.',
    image_url: null,
    youtube_url: null,
    linked_product_id: 'sleepyred-hoodie-neon',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    author_id: 'demo-user-2',
    profiles: {
      display_name: 'sleepy_fan99',
      email: 'fan99@example.com',
      username: 'sleepy_fan99',
      avatar_url: null
    },
    products: {
      name: 'Sleepyred Neon Hoodie',
      slug: 'sleepyred-hoodie-neon'
    }
  }
]

export default async function CommunityPage() {
  const supabase = await createClient()
  const currentUser = await getCurrentUser()

  // Fetch threads from Supabase
  const { data: threadsData } = await supabase
    .from('forum_threads')
    .select('*, profiles:author_id (display_name, email, username, avatar_url), products:linked_product_id (name, slug)')
    .eq('status', 'visible')
    .order('created_at', { ascending: false })

  const threads: ThreadWithAuthor[] = (threadsData && threadsData.length > 0) ? (threadsData as ThreadWithAuthor[]) : DEMO_THREADS

  // Fetch available products for tagging selector
  const { data: productsData } = await supabase
    .from('products')
    .select('id, name')
    .eq('is_published', true)

  const productsList = productsData || [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Criss Angel (Edición Digital)' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Sleepyred Neon Hoodie' }
  ]

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
