'use client'

import { useActionState } from 'react'
import { updateProduct, deleteProduct, type AdminActionState } from '@/app/admin/actions'
import type { Product } from '@/lib/types'
import { Trash2 } from 'lucide-react'

const initialState: AdminActionState = {}

export function EditProductForm({ product }: { product: Product }) {
  const [state, formAction, pending] = useActionState(updateProduct, initialState)
  const currentPriceDollars = (product.price_cents / 100).toFixed(2)

  return (
    <div className="space-y-6 font-sans">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={product.id} />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-neutral-300">Nombre del Producto *</label>
          <input
            type="text"
            name="name"
            required
            defaultValue={product.name}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-red-600 font-sans"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">Precio USD *</label>
            <input
              type="number"
              step="0.01"
              name="price"
              required
              defaultValue={currentPriceDollars}
              placeholder="0.99"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">Categoría</label>
            <select
              name="category"
              defaultValue={product.category}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-sans"
            >
              <option value="music">music (Música)</option>
              <option value="merch">merch (Ropa / Hoodie)</option>
              <option value="poster">poster (Póster A2)</option>
              <option value="bundle">bundle (Paquete)</option>
              <option value="other">other (Otro)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">Formato</label>
            <select
              name="fulfillment"
              defaultValue={product.fulfillment}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-sans"
            >
              <option value="digital">digital (Descarga inmediata)</option>
              <option value="physical">physical (Envío prenda física)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-neutral-300">Descripción del Producto</label>
          <textarea
            name="description"
            rows={4}
            defaultValue={product.description}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 text-sm text-white outline-none focus:border-red-600 font-sans"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-neutral-300">URL / Ruta Imagen de Portada o Merch</label>
          <input
            type="text"
            name="thumbnail_url"
            defaultValue={product.thumbnail_url || ''}
            placeholder="/songs/... o https://..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">URL / Ruta MP3 (320kbps)</label>
            <input
              type="text"
              name="mp3_url"
              defaultValue={product.mp3_url || ''}
              placeholder="/songs/... o https://..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">URL / Ruta WAV Máster (24-bit)</label>
            <input
              type="text"
              name="wav_url"
              defaultValue={product.wav_url || ''}
              placeholder="/songs/... o https://..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-mono"
            />
          </div>
        </div>

        {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
        {state?.success && <p className="text-xs text-emerald-400">{state.success}</p>}

        <div className="pt-3 flex items-center justify-between border-t border-neutral-800">
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-all cursor-pointer shadow-md disabled:opacity-60"
          >
            <span>{pending ? 'Guardando…' : 'Guardar Cambios de Producto'}</span>
          </button>
        </div>
      </form>

      <div className="pt-4 border-t border-neutral-900 flex justify-end">
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={product.id} />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-red-400 bg-neutral-900 hover:bg-red-950 border border-neutral-800 hover:border-red-900 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar Producto</span>
          </button>
        </form>
      </div>
    </div>
  )
}
