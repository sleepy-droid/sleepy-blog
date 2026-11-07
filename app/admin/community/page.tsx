import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { getAggregateVotesMap } from '@/lib/votes-server'
import { cn } from '@/lib/utils'
import {
  extractThreadProductIds,
  extractCleanThreadTags,
} from '@/app/community/page'
import {
  Flame,
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2,
  Tag,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
} from 'lucide-react'
import { adminHideThread, adminDeleteThread } from '../actions'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Moderación del Foro Comunidad | Panel Admin sleepyred999',
}

export default async function AdminCommunityPage() {
  await requireAdmin()
  const supabase = await createClient()

  // Consultar hilos sin el join directo a profiles (author_id apunta a auth.users)
  const [{ data: dbThreads }, { data: dbProducts }] = await Promise.all([
    supabase
      .from('forum_threads')
      .select('*')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false }),
    supabase.from('products').select('id, name, slug'),
  ])

  const threads = dbThreads || []
  const threadIds = threads.map((t) => String(t.id))
  const authorIds = Array.from(
    new Set(threads.map((t) => t.author_id).filter(Boolean))
  )

  const [profilesRes, honestVotesMap] = await Promise.all([
    authorIds.length > 0
      ? supabase
          .from('profiles')
          .select('id, display_name, email, avatar_url, username')
          .in('id', authorIds)
      : Promise.resolve({ data: [] }),
    getAggregateVotesMap({
      supabase,
      targetType: 'forum_thread',
      targetIds: threadIds,
    }),
  ])

  const profileMap = new Map<
    string,
    {
      display_name?: string | null
      email?: string | null
      avatar_url?: string | null
      username?: string | null
    }
  >()
  for (const p of profilesRes.data || []) {
    profileMap.set(String(p.id), p)
  }

  const productMap = new Map<string, { id: string; name: string; slug: string }>()
  for (const pr of dbProducts || []) {
    productMap.set(String(pr.id), pr)
    if (pr.slug) productMap.set(String(pr.slug), pr)
  }

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Flame className="w-6 h-6 text-red-500" />
              Moderación de Hilos del Foro Comunidad ({threads.length})
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Revisa estadísticas reales de votos, oculta/restaura o elimina hilos publicados en el foro.
            </p>
          </div>
        </div>

        <Link
          href="/community"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-300 bg-neutral-900 border border-neutral-800 hover:text-white"
        >
          <span>Ver Foro Público ↗</span>
        </Link>
      </header>

      <div className="space-y-4">
        {threads.map((t) => {
          const profile = profileMap.get(String(t.author_id))
          const authorName =
            profile?.display_name ||
            profile?.username ||
            profile?.email?.split('@')[0] ||
            'Miembro'
          const authorAvatar = profile?.avatar_url
          const isHidden = t.status === 'hidden'
          const votes = honestVotesMap[String(t.id)] || {
            upvotes: 0,
            downvotes: 0,
          }
          const taggedProducts = extractThreadProductIds(t)
            .map((pid) => productMap.get(pid))
            .filter(Boolean)
          const cleanTags = extractCleanThreadTags(t.tags)

          return (
            <article
              key={t.id}
              className={cn(
                'border rounded-2xl p-5 space-y-3 transition-all',
                isHidden
                  ? 'bg-red-950/20 border-red-900/40 opacity-80'
                  : 'bg-neutral-950/80 border-neutral-800'
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                    {authorAvatar ? (
                      <Image
                        src={authorAvatar}
                        alt={authorName}
                        fill
                        unoptimized={authorAvatar.endsWith('.svg')}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-red-400">
                        {authorName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      @{authorName}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {new Date(t.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold bg-neutral-900 px-2.5 py-1 rounded-full border border-neutral-800">
                    <ThumbsUp className="w-3 h-3" /> {votes.upvotes}
                  </span>
                  <span className="flex items-center gap-1 text-red-400 font-bold bg-neutral-900 px-2.5 py-1 rounded-full border border-neutral-800">
                    <ThumbsDown className="w-3 h-3" /> {votes.downvotes}
                  </span>
                  {isHidden ? (
                    <span className="px-2.5 py-1 rounded-full bg-red-950 text-red-400 border border-red-900/60 font-bold text-[10px]">
                      Oculto
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 font-bold text-[10px]">
                      Visible
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{t.title}</h3>
                <p className="text-xs text-neutral-300 mt-1 line-clamp-3 leading-relaxed">
                  {t.body}
                </p>
              </div>

              {(taggedProducts.length > 0 || cleanTags.length > 0) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {taggedProducts.map((tp) => (
                    <span
                      key={tp!.id}
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-950/70 text-red-300 border border-red-800/50"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tp!.name}
                    </span>
                  ))}
                  {cleanTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Moderation Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/60 text-xs">
                <Link
                  href={'/community/' + String(t.id)}
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 text-xs flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span>Ver Hilo</span>
                </Link>

                <form action={adminHideThread}>
                  <input type="hidden" name="id" value={t.id} />
                  <input
                    type="hidden"
                    name="current_status"
                    value={t.status || 'visible'}
                  />
                  <button
                    type="submit"
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer flex items-center gap-1',
                      isHidden
                        ? 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border-emerald-800'
                        : 'bg-amber-950 text-amber-400 hover:bg-amber-900 border-amber-800'
                    )}
                  >
                    {isHidden ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Restaurar Visible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ocultar</span>
                      </>
                    )}
                  </button>
                </form>

                <form action={adminDeleteThread}>
                  <input type="hidden" name="id" value={t.id} />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-red-950/60 text-red-300 hover:bg-red-900 hover:text-white border border-red-900/60 text-xs font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </form>
              </div>
            </article>
          )
        })}

        {threads.length === 0 && (
          <div className="p-8 text-center border border-neutral-800 rounded-2xl text-neutral-500 text-xs font-mono">
            No hay hilos activos en el foro.
          </div>
        )}
      </div>
    </main>
  )
}
