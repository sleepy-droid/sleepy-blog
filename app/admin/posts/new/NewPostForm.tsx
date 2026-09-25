'use client'

import { useActionState } from 'react'
import { createPost, type AdminActionState } from '@/app/admin/actions'
import type { Product } from '@/lib/types'

const initialState: AdminActionState = {}

type NewPostFormProps = {
  products: Pick<Product, 'id' | 'name' | 'slug' | 'price_cents' | 'category' | 'fulfillment' | 'created_at'>[]
}

export function NewPostForm({ products }: NewPostFormProps) {
  const [state, formAction, pending] = useActionState(createPost, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-neutral-300">Título de la Publicación *</label>
        <input
          type="text"
          name="title"
          required
          placeholder="Ej: O.D.M. — Lanzamiento Oficial & Arte Digital"
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-sans"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-neutral-300">Categoría General</label>
        <input
          type="text"
          name="category"
          placeholder="Lanzamiento, Merchandising, Noticias..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-sans"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-neutral-300">Precio USD Manual (Opcional)</label>
          <input
            type="number"
            step="0.01"
            name="price"
            placeholder="0.99"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
          />
        </div>

        {/* Dropdown Selector para Vincular Producto de la Tienda (Newest to Oldest) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-neutral-300 flex items-center justify-between">
            <span>Vincular Producto de la Tienda (Opcional)</span>
            <span className="text-[10px] text-neutral-500 font-mono">Nuevo → Antiguo</span>
          </label>
          <select
            name="linked_product_id"
            defaultValue=""
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-sans cursor-pointer"
          >
            <option value="">Ninguno (Entrada estándar de feed)</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — ${(p.price_cents / 100).toFixed(2)} USD [{p.fulfillment === 'digital' ? 'Música' : 'Merch'}]
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-neutral-300">Contenido / Texto Principal *</label>
        <textarea
          name="content"
          required
          rows={6}
          placeholder="Escribe el texto o historia de la entrada..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-sans"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-neutral-300">URL / Ruta de Imagen de Portada</label>
        <input
          type="text"
          name="image_url"
          placeholder="/songs/odm/odm.jpg o https://..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-neutral-300">URL / Ruta de Audio o SoundCloud (Opcional)</label>
        <input
          type="text"
          name="media_url"
          placeholder="/songs/odm/ODM.wav o https://..."
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
  )
}
