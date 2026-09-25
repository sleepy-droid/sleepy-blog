import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { ArrowLeft, Edit3 } from 'lucide-react'
import { EditPostForm } from './EditPostForm'
import type { Post } from '@/lib/types'

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  await requireAdmin()
  const { id } = await params
  const supabase = await createClient()

  const [{ data: post }, { data: products }] = await Promise.all([
    supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('products')
      .select('id, name, slug, price_cents, category, fulfillment, created_at')
      .order('created_at', { ascending: false }),
  ])

  const demoPost: Post = {
    id,
    title: 'Criss Angel — Lanzamiento Oficial & Arte Digital',
    content: 'Criss Angel ya está disponible en todas las plataformas y exclusivamente en nuestra tienda oficial.',
    category: 'Lanzamiento',
    created_at: new Date().toISOString(),
    image_url: '/images/releases/criss-angel.jpg',
    price: 12,
  }

  const activePost: Post = (post as Post) || demoPost

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
      <nav>
        <Link href="/admin/posts" className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Volver a Publicaciones
        </Link>
      </nav>

      <div className="border border-neutral-800/90 rounded-3xl p-6 sm:p-8 bg-neutral-950 space-y-6 shadow-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-red-500" />
            Editar Publicación #{activePost.id.slice(0, 8)}
          </h1>
        </div>

        <EditPostForm post={activePost} products={products ?? []} />
      </div>
    </main>
  )
}
