'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, PlusCircle } from 'lucide-react'
import { createPost, type AdminActionState } from '@/app/admin/actions'

const initialState: AdminActionState = {}

export default function NewPostPage() {
  const [state, formAction, pending] = useActionState(createPost, initialState)

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
            Crea una entrada oficial para el newsfeed principal de la portada.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">Título de la Publicación *</label>
            <input
              type="text"
              name="title"
              required
              placeholder="Ej: Criss Angel — Lanzamiento Oficial & Arte Digital"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">Categoría</label>
              <input
                type="text"
                name="category"
                placeholder="Lanzamiento, Merchandising, Noticias..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">Precio USD (Opcional)</label>
              <input
                type="number"
                step="0.01"
                name="price"
                placeholder="12.00"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">Contenido / Texto Principal *</label>
            <textarea
              name="content"
              required
              rows={6}
              placeholder="Escribe el texto de la entrada..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">URL de Imagen de Portada</label>
            <input
              type="url"
              name="image_url"
              placeholder="https://..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">URL de Audio / SoundCloud (Opcional)</label>
            <input
              type="url"
              name="media_url"
              placeholder="https://soundcloud.com/..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
            />
          </div>

          {state?.error && <p className="text-xs text-red-400">{state.error}</p>}

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-all cursor-pointer shadow-md disabled:opacity-60"
            >
              <span>{pending ? 'Creando…' : 'Guardar y Publicar'}</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
