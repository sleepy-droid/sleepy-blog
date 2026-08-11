import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { Flame, ArrowLeft, Eye, EyeOff, Trash2, Tag, ThumbsUp } from 'lucide-react'
import { adminHideThread, adminDeleteThread } from '../actions'

export const metadata = {
  title: 'Moderación del Foro Comunidad | Panel Admin sleepyred999',
}

export default async function AdminCommunityPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: dbThreads } = await supabase
    .from('forum_threads')
    .select('*, profiles:author_id (display_name, email, avatar_url, username)')
    .order('created_at', { ascending: false })

  const threads = dbThreads || []

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Flame className="w-6 h-6 text-red-500" />
              Moderación de Hilos del Foro Comunidad
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Revisa, oculta o elimina hilos publicados por miembros de la comunidad para evitar spam.
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
          const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles
          const authorName = (profile as { display_name?: string; username?: string })?.display_name || (profile as { username?: string })?.username || 'Miembro'
          const authorAvatar = (profile as { avatar_url?: string })?.avatar_url
          const isHidden = t.status === 'hidden'

          return (
            <article
              key={t.id}
              className={`border rounded-2xl p-5 space-y-3 transition-all ${
                isHidden ? 'bg-red-950/20 border-red-900/40 opacity-75' : 'bg-neutral-950/80 border-neutral-800'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                    {authorAvatar ? (
                      <Image src={authorAvatar} alt={authorName} fill className="object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-red-400">{authorName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">@{authorName}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {new Date(t.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="flex items-center gap-1 text-red-400 font-bold bg-neutral-900 px-2.5 py-1 rounded-full border border-neutral-800">
                    <ThumbsUp className="w-3 h-3" /> {t.upvotes || 0}
                  </span>
                  {isHidden && (
                    <span className="px-2.5 py-1 rounded-full bg-red-950 text-red-400 border border-red-900/60 font-bold text-[10px]">
                      Oculto por Spam
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{t.title}</h3>
                <p className="text-xs text-neutral-300 mt-1 line-clamp-3 leading-relaxed">{t.body}</p>
              </div>

              {/* Moderation Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/60 text-xs">
                <Link
                  href={`/community/${t.id}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 text-xs flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span>Ver Hilo</span>
                </Link>

                <form action={adminHideThread}>
                  <input type="hidden" name="id" value={t.id} />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-amber-950 text-amber-400 hover:bg-amber-900 border border-amber-800 text-xs font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>{isHidden ? 'Oculto' : 'Ocultar'}</span>
                  </button>
                </form>

                <form action={adminDeleteThread}>
                  <input type="hidden" name="id" value={t.id} />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-900 text-xs cursor-pointer flex items-center gap-1"
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
            No hay hilos del foro registrados aún.
          </div>
        )}
      </div>
    </main>
  )
}
