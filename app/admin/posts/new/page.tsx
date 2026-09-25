import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { NewPostForm } from './NewPostForm'

export const metadata = {
  title: 'Nueva Publicación | Panel Admin sleepyred999',
}

export default async function NewPostPage() {
  await requireAdmin()
  const supabase = await createClient()

  // Obtener productos ordenados de más reciente a más antiguo (newest to latest/oldest)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price_cents, category, fulfillment, created_at')
    .order('created_at', { ascending: false })

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
            <Sparkles className="w-5 h-5 text-red-500" />
            Nueva Publicación en la Bitácora
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Crea una entrada oficial para el newsfeed principal de la portada. Puedes vincular un producto de la tienda para destacarlo o dejarlo como entrada estándar.
          </p>
        </div>

        <NewPostForm products={products ?? []} />
      </div>
    </main>
  )
}
