'use client'

import { useState, useActionState } from 'react'
import { updatePost, type AdminActionState } from '@/app/admin/actions'
import { extractPostProductIds, stripPostProductsMarker } from '@/lib/utils'
import type { Post, Product } from '@/lib/types'

const initialState: AdminActionState = {}

type EditPostFormProps = {
  post: Post
  products?: Pick<
    Product,
    'id' | 'name' | 'slug' | 'price_cents' | 'category' | 'fulfillment' | 'created_at'
  >[]
}

export function EditPostForm({ post, products = [] }: EditPostFormProps) {
  const [state, formAction, pending] = useActionState(updatePost, initialState)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() =>
    extractPostProductIds(post)
  )

  const cleanContent = stripPostProductsMarker(post.content)

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      }
      if (prev.length >= 3) {
        return prev
      }
      return [...prev, productId]
    })
  }

  return (
    <form action={formAction} className="space-y-4 font-sans">
      <input type="hidden" name="id" value={post.id} />

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-neutral-300">
          Título de la Publicación *
        </label>
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
          <label className="block text-xs font-medium text-neutral-300">
            Categoría General
          </label>
          <input
            type="text"
            name="category"
            defaultValue={post.category || 'General'}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-sans"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-neutral-300">
            Precio USD Manual (Opcional)
          </label>
          <input
            type="number"
            step="0.01"
            name="price"
            defaultValue={post.price || 0}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-mono"
          />
        </div>
      </div>

          {/* Selector de hasta 3 Productos Etiquetados */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-neutral-300">
                Etiquetar Productos de la Tienda (Máximo 3)
              </label>
              <span className="text-[11px] font-mono font-bold text-red-400">
                {selectedProductIds.length} / 3 seleccionados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2.5 bg-neutral-900/60 border border-neutral-800 rounded-xl">
              {products.map((p) => {
                const isSelected = selectedProductIds.includes(p.id)
                const isDisabled = !isSelected && selectedProductIds.length >= 3
                return (
                  <label
                    key={p.id}
                    className={`product-tag-label px-3 py-1.5 rounded-xl text-xs font-mono border transition-colors ${isSelected
                        ? 'bg-red-950/80 text-red-200 border-red-800 font-bold'
                        : isDisabled
                          ? 'bg-neutral-950/50 text-neutral-600 border-neutral-900 cursor-not-allowed opacity-60'
                          : 'bg-neutral-950 text-neutral-300 hover:text-white border-neutral-800'
                      }`}
                  >
                    <input
                      type="checkbox"
                      name="linked_product_ids"
                      value={p.id}
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => toggleProduct(p.id)}
                      className="checkbox-custom"
                    />
                    <span className="truncate">
                      {p.name} — ${(p.price_cents / 100).toFixed(2)}
                    </span>
                  </label>
                )
              })}
            </div>

            <input
              type="hidden"
              name="linked_product_id"
              value={selectedProductIds[0] || ''}
            />
            <input
              type="hidden"
              name="linked_product_ids_csv"
              value={selectedProductIds.join(',')}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">
              Contenido / Texto Principal *
            </label>
            <textarea
              name="content"
              required
              rows={6}
              defaultValue={cleanContent}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 text-sm text-white outline-none focus:border-red-600 font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">
              URL / Ruta de Imagen de Portada
            </label>
            <input
              type="text"
              name="image_url"
              defaultValue={post.image_url || ''}
              placeholder="/songs/... o https://..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">
              URL / Ruta de Audio o SoundCloud (Opcional)
            </label>
            <input
              type="text"
              name="media_url"
              defaultValue={post.media_url || ''}
              placeholder="/songs/... o https://..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-mono"
            />
          </div>

          {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
          {state?.success && (
            <p className="text-xs text-emerald-400">{state.success}</p>
          )}

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
