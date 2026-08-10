import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { PlusCircle, Edit3, Trash2, ArrowLeft, FileText, Sparkles, ExternalLink } from 'lucide-react'
import type { Post } from '@/lib/types'
import { deletePost } from '../actions'

export const metadata = {
  title: 'Gestión de Publicaciones | Panel Admin sleepyred999',
}

export default async function AdminPostsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: dbPosts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  const posts: Post[] = dbPosts || []

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-red-500" />
              Gestión de Publicaciones de la Bitácora
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Crea, edita, oculta o elimina entradas del newsfeed de la portada.
          </p>
        </div>

        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-all shadow-md cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Nueva Publicación</span>
        </Link>
      </header>

      <div className="border border-neutral-800/80 rounded-2xl bg-neutral-950 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60 font-mono text-neutral-400 uppercase tracking-wider">
                <th className="p-4">Publicación</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Precio</th>
                <th className="p-4">Vistas / Likes</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                        {post.image_url ? (
                          <Image src={post.image_url} alt={post.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600">Post</div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-white line-clamp-1">{post.title}</h3>
                        <p className="text-[11px] text-neutral-500 font-mono">
                          {new Date(post.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-neutral-900 text-neutral-300 border border-neutral-800">
                      {post.category || 'General'}
                    </span>
                  </td>

                  <td className="p-4 font-mono font-bold text-red-400">
                    {post.price ? `$${post.price}` : 'Gratis'}
                  </td>

                  <td className="p-4 font-mono text-neutral-400">
                    👁 {post.view_count || 0} • ❤️ {post.like_count || 0}
                  </td>

                  <td className="p-4 text-right space-x-2">
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Editar</span>
                    </Link>

                    <form action={deletePost} className="inline-block">
                      <input type="hidden" name="id" value={post.id} />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-red-950 text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-900 transition-colors cursor-pointer"
                        title="Eliminar publicación"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
