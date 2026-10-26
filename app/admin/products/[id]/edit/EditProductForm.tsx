'use client'

import { useActionState } from 'react'
import { updateProduct, deleteProduct, type AdminActionState } from '@/app/admin/actions'
import type { Product } from '@/lib/types'
import {
  Trash2,
  FolderOpen,
  Upload,
  Image as ImageIcon,
  Music,
  Mic,
  Sliders,
  Video,
} from 'lucide-react'

const initialState: AdminActionState = {}

export function EditProductForm({ product }: { product: Product }) {
  const [state, formAction, pending] = useActionState(updateProduct, initialState)
  const currentPriceDollars = (product.price_cents / 100).toFixed(2)
  const baseFolder = product.category === 'music' || product.fulfillment === 'digital' ? 'songs' : 'merch'
  const canonicalFolder = product.storage_folder_path || `${baseFolder}/${product.slug}`

  return (
    <div className="space-y-6 font-sans">
      <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-neutral-300">
          <FolderOpen className="w-4 h-4 text-red-500" />
          <span>Directorio vinculado:</span>
          <strong className="text-red-400">public/{canonicalFolder}/</strong>
        </div>
        <span className="text-[11px] text-neutral-500">Slug: {product.slug}</span>
      </div>

      <form action={formAction} className="space-y-5">
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

        {/* Media Assets Section with Direct File Upload */}
        <div className="space-y-4 p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Archivos Multimedia en /{canonicalFolder}/
            </h3>
            <span className="text-[11px] font-mono text-neutral-500">
              Sube un archivo nuevo para reemplazar o edita la ruta
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cover */}
            <div className="space-y-1.5 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-pink-400" /> Portada HD / Imagen
              </label>
              <input
                type="file"
                name="cover_file"
                accept="image/*"
                className="block w-full text-xs text-neutral-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-950 file:text-red-300 hover:file:bg-red-900 cursor-pointer"
              />
              <input
                type="text"
                name="thumbnail_url"
                defaultValue={product.thumbnail_url || ''}
                placeholder="/songs/... o https://..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-red-600 font-mono"
              />
            </div>

            {/* MP3 */}
            <div className="space-y-1.5 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-sky-400" /> Audio MP3 (320kbps / Preview)
              </label>
              <input
                type="file"
                name="mp3_file"
                accept=".mp3,audio/mpeg"
                className="block w-full text-xs text-neutral-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-950 file:text-red-300 hover:file:bg-red-900 cursor-pointer"
              />
              <input
                type="text"
                name="mp3_url"
                defaultValue={product.mp3_url || ''}
                placeholder="/songs/... o https://..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-red-600 font-mono"
              />
            </div>

            {/* WAV */}
            <div className="space-y-1.5 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-emerald-400" /> Audio WAV Máster (24-bit)
              </label>
              <input
                type="file"
                name="wav_file"
                accept=".wav,audio/wav,audio/x-wav"
                className="block w-full text-xs text-neutral-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-950 file:text-red-300 hover:file:bg-red-900 cursor-pointer"
              />
              <input
                type="text"
                name="wav_url"
                defaultValue={product.wav_url || ''}
                placeholder="/songs/... o https://..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-red-600 font-mono"
              />
            </div>

            {/* Acapella */}
            <div className="space-y-1.5 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-amber-400" /> Vocal Acapella (.WAV / .MP3)
              </label>
              <input
                type="file"
                name="acapella_file"
                accept=".wav,.mp3,audio/*"
                className="block w-full text-xs text-neutral-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-950 file:text-red-300 hover:file:bg-red-900 cursor-pointer"
              />
              <input
                type="text"
                name="acapella_url"
                defaultValue={product.acapella_url || ''}
                placeholder="/songs/.../acapella.wav"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-red-600 font-mono"
              />
            </div>

            {/* Instrumental */}
            <div className="space-y-1.5 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-red-400" /> Pista Instrumental (.WAV / .MP3)
              </label>
              <input
                type="file"
                name="instrumental_file"
                accept=".wav,.mp3,audio/*"
                className="block w-full text-xs text-neutral-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-950 file:text-red-300 hover:file:bg-red-900 cursor-pointer"
              />
              <input
                type="text"
                name="instrumental_url"
                defaultValue={product.instrumental_url || ''}
                placeholder="/songs/.../instrumental.wav"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-red-600 font-mono"
              />
            </div>

            {/* Video URL */}
            <div className="space-y-1.5 p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
              <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-purple-400" /> Enlace a Vídeo Oficial (YouTube Embed / URL)
              </label>
              <input
                type="text"
                name="video_url"
                defaultValue={product.video_url || ''}
                placeholder="https://www.youtube.com/embed/..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-red-600 font-mono"
              />
            </div>
          </div>
        </div>

        {state?.error && <p className="text-xs text-red-400 font-semibold">{state.error}</p>}
        {state?.success && <p className="text-xs text-emerald-400 font-semibold">{state.success}</p>}

        <div className="pt-3 flex items-center justify-between border-t border-neutral-800">
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-all cursor-pointer shadow-md disabled:opacity-60"
          >
            <span>{pending ? 'Sincronizando archivos…' : 'Guardar Cambios y Sincronizar Carpeta'}</span>
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
