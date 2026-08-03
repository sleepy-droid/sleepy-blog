import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import {
  FileText,
  MessageSquare,
  Users,
  Flame,
  ArrowRight,
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    { count: postsCount },
    { count: commentsCount },
    { count: usersCount },
    { count: recentCommentsCount },
    { data: latestPosts },
    { data: latestComments },
  ] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString()),
    supabase
      .from('posts')
      .select('id, title, category, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('comments')
      .select('id, body, post_id, created_at, profiles:user_id (display_name)')
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
      label: 'Usuarios',
      value: usersCount ?? 0,
      icon: Users,
      href: '/admin',
      color: 'text-amber-300',
    },
    {
      label: 'Comentarios (7 días)',
      value: recentCommentsCount ?? 0,
      icon: Flame,
      href: '/admin/comments',
      color: 'text-red-500',
    },
  ]

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">Resumen</h1>
        <p className="text-sm text-neutral-400">
          Métricas en vivo de tu bitácora sleepyred999.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <Link
              key={m.label}
              href={m.href}
              className="rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-4 hover:border-red-900/40 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${m.color}`} />
                <ArrowRight className="w-3 h-3 text-neutral-600" />
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{m.value}</p>
              <p className="text-[11px] text-neutral-500 font-medium uppercase tracking-wide">
                {m.label}
              </p>
            </Link>
          )
        })}
      </section>

      <div className="grid md:grid-cols-2 gap-5">
        <section className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Últimas publicaciones</h2>
            <Link href="/admin/posts" className="text-[11px] text-red-400 hover:text-red-300">
              Ver todas
            </Link>
          </div>
          <ul className="space-y-2">
            {(latestPosts ?? []).length === 0 && (
              <li className="text-xs text-neutral-500">Sin publicaciones aún.</li>
            )}
            {(latestPosts ?? []).map((post) => (
              <li key={post.id}>
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="block rounded-lg px-2 py-2 hover:bg-neutral-800/50 transition-colors"
                >
                  <p className="text-sm text-neutral-200 truncate">{post.title}</p>
                  <p className="text-[10px] text-neutral-500">
                    {post.category} ·{' '}
                    {new Date(post.created_at).toLocaleDateString('es-ES')}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Últimos comentarios</h2>
            <Link href="/admin/comments" className="text-[11px] text-red-400 hover:text-red-300">
              Moderar
            </Link>
          </div>
          <ul className="space-y-2">
            {(latestComments ?? []).length === 0 && (
              <li className="text-xs text-neutral-500">Sin comentarios aún.</li>
            )}
            {(latestComments ?? []).map((c) => {
              // Supabase tipa el join a veces como array; normalizamos
              const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
              const name =
                (profile as { display_name?: string } | null)?.display_name || 'Usuario'
              return (
                <li
                  key={c.id}
                  className="rounded-lg px-2 py-2 border-b border-neutral-800/40 last:border-0"
                >
                  <p className="text-xs text-neutral-400">@{name}</p>
                  <p className="text-sm text-neutral-200 line-clamp-2">{c.body}</p>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
