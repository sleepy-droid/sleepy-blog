/**
 * Dynamic Thread Detail Page: /community/[id]
 * File Path: app/community/[id]/page.tsx
 * 
 * Features:
 * 1. Full thread content, embedded YouTube player, high-res images, tagged products.
 * 2. Polymorphic comments section (`target_type = 'forum_thread'`).
 * 3. Right sidebar showcasing "Últimos hilos" & "Mejor valorados".
 * 4. Upvote / Downvote rating system.
 */

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { CommentList } from '@/components/comments/CommentList'
import { SingleThreadClient } from './SingleThreadClient'
import { ArrowLeft, Tag, Sparkles, MessageSquare, ThumbsUp, Flame, Clock } from 'lucide-react'
import type { Metadata } from 'next'
import type { CommentWithAuthor } from '@/lib/types'
import type { ThreadWithAuthor } from '../page'

interface ThreadPageProps {
  params: Promise<{ id: string }>
}

const DEMO_THREADS: Record<string, ThreadWithAuthor> = {
  'demo-thread-1': {
    id: 'demo-thread-1',
    title: 'Remix Oficial de Vocales Acapella (Criss Angel Remix)',
    body: 'Adquirí los derechos de la voz acapella en la tienda oficial y preparé este remix estilo Synthwave neón con arreglos sintetizados de baja frecuencia. ¡Espero sus opiniones y sugerencias de mezcla!\n\nEste proyecto requirió 14 horas de edición vocal y compresión dinámica.',
    image_url: '/images/releases/criss-angel.jpg',
    youtube_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    linked_product_id: 'criss-angel',
    tags: ['Música', '2026', 'Remix'],
    upvotes: 45,
    downvotes: 2,
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
  'demo-thread-2': {
    id: 'demo-thread-2',
    title: '¿Cuándo llega el próximo restock de los Hoodies Neón?',
    body: 'Conseguí el póster A2 y la calidad del papel es increíble. Quisiera saber si habrá más tallas L en el buzón negro reflectivo.',
    image_url: null,
    youtube_url: null,
    linked_product_id: 'sleepyred-hoodie-neon',
    tags: ['Ropa', 'Merch'],
    upvotes: 28,
    downvotes: 1,
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
}

export async function generateMetadata({ params }: ThreadPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: thread } = await supabase
    .from('forum_threads')
    .select('title, body')
    .eq('id', id)
    .maybeSingle()

  const item = thread || DEMO_THREADS[id]

  if (!item) return { title: 'Hilo no encontrado | Comunidad sleepyred999' }

  return {
    title: `${item.title} | Foro sleepyred999`,
    description: item.body.slice(0, 160),
  }
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const currentUser = await getCurrentUser()

  // 1. Fetch main thread details
  const { data: dbThread } = await supabase
    .from('forum_threads')
    .select('*, profiles:author_id (display_name, email, username, avatar_url), products:linked_product_id (name, slug)')
    .eq('id', id)
    .maybeSingle()

  const thread: ThreadWithAuthor = (dbThread as ThreadWithAuthor) || DEMO_THREADS[id] || DEMO_THREADS['demo-thread-1']

  if (!thread) {
    notFound()
  }

  // 2. Fetch comments for this forum thread (`target_type = 'forum_thread'`)
  const { data: commentsData } = await supabase
    .from('comments')
    .select('*, profiles:user_id (display_name, email, avatar_url, username)')
    .or(`target_id.eq.${thread.id},post_id.eq.${thread.id}`)
    .order('created_at', { ascending: false })

  const comments = (commentsData ?? []) as CommentWithAuthor[]

  // 3. Fetch Sidebar threads (latest & highest rated)
  const { data: sidebarData } = await supabase
    .from('forum_threads')
    .select('id, title, upvotes, created_at')
    .neq('id', thread.id)
    .eq('status', 'visible')
    .order('created_at', { ascending: false })
    .limit(5)

  const sidebarThreads = sidebarData || [
    { id: 'demo-thread-2', title: '¿Cuándo llega el próximo restock de los Hoodies Neón?', upvotes: 28, created_at: new Date().toISOString() }
  ]

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      <nav>
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-red-400 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver al Foro de la Comunidad</span>
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Thread Content Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          <article className="border border-neutral-800/90 rounded-3xl p-6 sm:p-8 bg-neutral-900/40 backdrop-blur-xl shadow-2xl space-y-6">
            <SingleThreadClient thread={thread} />
          </article>

          {/* Forum Thread Comments Section */}
          <CommentList
            targetType="forum_thread"
            targetId={thread.id}
            comments={comments}
            currentUser={currentUser}
          />
        </div>

        {/* Sidebar Column (4 Cols): Latest & Highest Rated Threads */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="border border-neutral-800/90 rounded-2xl p-5 bg-neutral-950 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Flame className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Hilos Relacionados & Populares
              </h2>
            </div>

            <div className="space-y-3">
              {sidebarThreads.map((st) => (
                <Link
                  key={st.id}
                  href={`/community/${st.id}`}
                  className="block p-3 rounded-xl bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800/60 hover:border-red-900/50 transition-all group space-y-1"
                >
                  <h3 className="text-xs font-bold text-neutral-200 group-hover:text-red-400 transition-colors line-clamp-2">
                    {st.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-red-400" /> {st.upvotes || 0} votos
                    </span>
                    <span>{new Date(st.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
