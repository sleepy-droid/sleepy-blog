'use client'

import { useActionState } from 'react'
import { updatePost, type AdminActionState } from '@/app/admin/actions'
import type { Post } from '@/lib/types'

const initialState: AdminActionState = {}

export function EditPostForm({ post }: { post: Post }) {
  const [state, formAction, pending] = useActionState(updatePost, initialState)

  return (
    <form action={formAction} className="space-y-4 font-sans">
      <input type="hidden" name="id" value={post.id} />

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-neutral-300">Título de la Publicación *</label>
        <input
          type="text"
          name="title"
          required
          defaultValue={post.title}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-red-600 font-sans"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-neutral-300">Categoría General</label>
          <input
            type="text"
            name="category"
            defaultValue={post.category || 'General'}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-sans"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-neutral-300">Etiqueta del Carrusel (Highlight Tag)</label>
          <input
            type="text"
            name="highlight_tag"
            defaultValue={post.highlight_tag || ''}
            placeholder="Lanzamiento Destacado, Avance, Historia..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-sans"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-neutral-300">Precio USD Manual (Opcional)</label>
          <input
            type="number"
            step="0.01"
            name="price"
            defaultValue={post.price || 0}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-neutral-300">ID de Producto Vinculado (Opcional)</label>
          <input
            type="text"
            name="linked_product_id"
            defaultValue={post.linked_product_id || ''}
            placeholder="UUID del producto..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-mono"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-neutral-300">Contenido / Texto Principal *</label>
        <textarea
          name="content"
          required
          rows={6}
          defaultValue={post.content}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 text-sm text-white outline-none focus:border-red-600 font-sans"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-neutral-300">URL de Imagen de Portada</label>
        <input
          type="url"
          name="image_url"
          defaultValue={post.image_url || ''}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-neutral-300">URL de Audio / SoundCloud (Opcional)</label>
        <input
          type="url"
          name="media_url"
          defaultValue={post.media_url || ''}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-mono"
        />
      </div>

      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-400">{state.success}</p>}

      <div className="pt-3 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-all cursor-pointer shadow-md disabled:opacity-60"
        >
          <span>{pending ? 'Guardando…' : 'Actualizar Publicación'}</span>
        </button>
      </div>
    </form>
  )
}
