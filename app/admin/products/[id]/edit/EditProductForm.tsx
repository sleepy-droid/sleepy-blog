'use client'

import { useState, useActionState, useTransition } from 'react'
import { updateProduct, deleteProduct, type AdminActionState } from '@/app/admin/actions'
import { prepareProductFormDataWithDirectUpload } from '@/lib/client-product-upload'
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
  Loader2,
} from 'lucide-react'

const initialState: AdminActionState = {}

export function EditProductForm({ product }: { product: Product }) {
  const [state, formAction, actionPending] = useActionState(updateProduct, initialState)
  const [isTransitionPending, startTransition] = useTransition()
  const [isUploadingCdn, setIsUploadingCdn] = useState(false)
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const [selectedWavNames, setSelectedWavNames] = useState<string[]>([])
  const [selectedMp3Names, setSelectedMp3Names] = useState<string[]>([])
  const currentPriceDollars = (product.price_cents / 100).toFixed(2)
  const baseFolder = product.category === 'music' || product.fulfillment === 'digital' ? 'songs' : 'merch'
  const canonicalFolder = product.storage_folder_path || `${baseFolder}/${product.slug}`

  const pending = isUploadingCdn || actionPending || isTransitionPending

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (pending) return
    setClientError(null)
    setIsUploadingCdn(true)
    setUploadProgressText('Preparando archivos para Supabase Storage CDN...')

    try {
      const rawFormData = new FormData(e.currentTarget)
      const selectedCat = String(rawFormData.get('category') || product.category)
      const selectedFulf = String(rawFormData.get('fulfillment') || product.fulfillment)

      const { formData: cleanFormData, error } = await prepareProductFormDataWithDirectUpload(
        rawFormData,
        {
          slug: product.slug,
          category: selectedCat,
          fulfillment: selectedFulf,
          onProgress: (msg) => setUploadProgressText(msg),
        }
      )

      if (error) {
        setClientError(error)
        setIsUploadingCdn(false)
        setUploadProgressText(null)
        return
      }

      setIsUploadingCdn(false)
      startTransition(() => {
        formAction(cleanFormData)
      })
    } catch (err) {
      setClientError(
        err instanceof Error
          ? err.message
          : 'Error inesperado al subir archivos a Supabase Storage CDN.'
      )
      setIsUploadingCdn(false)
      setUploadProgressText(null)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-neutral-300">
          <FolderOpen className="w-4 h-4 text-red-500" />
          <span>Directorio CDN vinculado:</span>
          <strong className="text-red-400">/{canonicalFolder}/</strong>
        </div>
        <span className="text-[11px] text-neutral-500">Slug: {product.slug}</span>
      </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
                  <ImageIcon className="w-3.5 h-3.5 text-pink-400" /> Portada HD / Imágenes
                </label>
                <input
                  type="file"
                  name="cover_file"
                  multiple
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
                  <Music className="w-3.5 h-3.5 text-sky-400" /> Audio MP3 (Sencillo o Álbum Multi-Pista)
                </label>
                <input
                  type="file"
                  name="mp3_file"
                  multiple
                  accept=".mp3,audio/mpeg"
                  onChange={(e) =>
                    setSelectedMp3Names(
                      e.target.files ? Array.from(e.target.files).map((f) => f.name) : []
                    )
                  }
                  className="block w-full text-xs text-neutral-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-950 file:text-red-300 hover:file:bg-red-900 cursor-pointer"
                />
                {selectedMp3Names.length > 0 && (
                  <p className="text-[10px] font-mono text-sky-300">
                    {selectedMp3Names.length} pista(s) MP3: {selectedMp3Names.join(', ')}
                  </p>
                )}
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
                  <Music className="w-3.5 h-3.5 text-emerald-400" /> Audio WAV Máster (Sencillo o Álbum Multi-Archivo)
                </label>
                <input
                  type="file"
                  name="wav_file"
                  multiple
                  accept=".wav,audio/wav,audio/x-wav"
                  onChange={(e) =>
                    setSelectedWavNames(
                      e.target.files ? Array.from(e.target.files).map((f) => f.name) : []
                    )
                  }
                  className="block w-full text-xs text-neutral-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-950 file:text-red-300 hover:file:bg-red-900 cursor-pointer"
                />
                {selectedWavNames.length > 0 && (
                  <p className="text-[10px] font-mono text-emerald-300">
                    {selectedWavNames.length} archivo(s) WAV: {selectedWavNames.join(', ')}
                  </p>
                )}
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
                  multiple
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
                  multiple
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

          {uploadProgressText && pending && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/70 flex items-center gap-2.5 text-xs font-mono text-red-200">
              <Loader2 className="w-4 h-4 text-red-400 animate-spin shrink-0" />
              <span>{uploadProgressText}</span>
            </div>
          )}

          {(clientError || state?.error) && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-700 text-xs text-red-300 font-semibold">
              {clientError || state?.error}
            </div>
          )}
          {state?.success && <p className="text-xs text-emerald-400 font-semibold">{state.success}</p>}

          <div className="pt-3 flex items-center justify-between border-t border-neutral-800">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-all cursor-pointer shadow-md disabled:opacity-60"
            >
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {pending
                  ? uploadProgressText || 'Sincronizando archivos con Supabase CDN…'
                  : 'Guardar Cambios y Sincronizar Carpeta CDN'}
              </span>
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
