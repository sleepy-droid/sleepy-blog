import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import {
  FileText,
  MessageSquare,
  Users,
  Flame,
  ArrowRight,
  ShoppingBag,
  PlusCircle,
  EyeOff,
  Trash2,
} from 'lucide-react'
import { adminHideThread, adminDeleteThread } from './actions'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: postsCount },
    { count: commentsCount },
    { count: usersCount },
    { count: forumThreadsCount },
    { data: latestPosts },
    { data: latestComments },
    { data: latestThreads },
  ] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('forum_threads').select('*', { count: 'exact', head: true }),
    supabase
      .from('posts')
      .select('id, title, category, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('comments')
      .select('id, body, post_id, created_at, profiles:user_id (display_name, username)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('forum_threads')
      .select('id, title, body, status, created_at, profiles:author_id (display_name, username)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const metrics = [
    {
      label: 'Publicaciones',
      value: postsCount ?? 0,
      icon: FileText,
      href: '/admin/posts',
      color: 'text-red-400',
    },
    {
      label: 'Comentarios',
      value: commentsCount ?? 0,
      icon: MessageSquare,
      href: '/admin/comments',
      color: 'text-orange-400',
    },
    {
      label: 'Usuarios Registrados',
      value: usersCount ?? 0,
      icon: Users,
      href: '/admin/users',
      color: 'text-amber-300',
    },
    {
      label: 'Hilos del Foro',
      value: forumThreadsCount ?? 0,
      icon: Flame,
      href: '/community',
      color: 'text-red-500',
    },
  ]

  return (
    <div className="space-y-8 font-sans">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Panel de Control & Resumen</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Métricas en vivo, moderación nocturna y catálogo de sleepyred999.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-colors shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Crear Post</span>
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-200 bg-neutral-900 border border-neutral-800 hover:text-white transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-red-400" />
            <span>+ Producto</span>
          </Link>
        </div>
      </header>

      {/* Metrics Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <Link
              key={m.label}
              href={m.href}
              className="rounded-2xl border border-neutral-800/80 bg-neutral-900/50 p-4 hover:border-red-900/40 transition-all space-y-2 backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${m.color}`} />
                <ArrowRight className="w-3 h-3 text-neutral-600" />
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{m.value}</p>
              <p className="text-[11px] text-neutral-400 font-mono font-medium uppercase tracking-wide">
                {m.label}
              </p>
            </Link>
          )
        })}
      </section>

      {/* Recent Forum Threads Moderation Block (Sleeping Moderation) */}
      <section className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 space-y-4 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Hilos Recientes del Foro (Moderación de Spam)
            </h2>
          </div>
          <Link href="/community" className="text-xs font-semibold text-red-400 hover:text-red-300">
            Ver Foro Completo →
          </Link>
        </div>

        <div className="space-y-3">
          {(latestThreads ?? []).map((t) => {
            const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles
            const author = (profile as { display_name?: string; username?: string })?.display_name || 'Miembro'

            return (
              <div
                key={t.id}
                className="border border-neutral-800/60 bg-neutral-950 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">{t.title}</span>
                    <span className="text-[10px] font-mono text-neutral-400">by @{author}</span>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-1">{t.body}</p>
                </div>

                <div className="flex items-center gap-2 text-xs shrink-0">
                  <form action={adminHideThread}>
                    <input type="hidden" name="id" value={t.id} />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-400 hover:bg-amber-900 border border-amber-800 text-xs font-semibold cursor-pointer"
                    >
                      <EyeOff className="w-3.5 h-3.5 inline mr-1" />
                      Ocultar
                    </button>
                  </form>
                  <form action={adminDeleteThread}>
                    <input type="hidden" name="id" value={t.id} />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 text-neutral-400 hover:text-red-400 border border-neutral-800 text-xs cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Latest Posts & Latest Comments */}
      <div className="grid md:grid-cols-2 gap-5">
        <section className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 space-y-3 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Últimas Publicaciones</h2>
            <Link href="/admin/posts" className="text-xs font-semibold text-red-400 hover:text-red-300">
              Ver todas →
            </Link>
          </div>
          <ul className="space-y-2">
            {(latestPosts ?? []).map((post) => (
              <li key={post.id}>
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="block rounded-xl p-2.5 bg-neutral-950 border border-neutral-800/60 hover:border-red-900/50 transition-colors"
                >
                  <p className="text-xs font-bold text-white truncate">{post.title}</p>
                  <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    {post.category} · {new Date(post.created_at).toLocaleDateString('es-ES')}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 space-y-3 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Últimos Comentarios</h2>
            <Link href="/admin/comments" className="text-xs font-semibold text-red-400 hover:text-red-300">
              Moderar →
            </Link>
          </div>
          <ul className="space-y-2">
            {(latestComments ?? []).map((c) => {
              const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
              const name = (profile as { display_name?: string } | null)?.display_name || 'Usuario'
              return (
                <li
                  key={c.id}
                  className="rounded-xl p-2.5 bg-neutral-950 border border-neutral-800/60 space-y-1"
                >
                  <p className="text-[11px] font-bold text-red-400">@{name}</p>
                  <p className="text-xs text-neutral-200 line-clamp-2">{c.body}</p>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
