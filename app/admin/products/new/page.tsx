'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Sparkles,
  Music,
  Image as ImageIcon,
  Video,
  Mic,
  Sliders,
  FolderPlus,
  Upload,
  ShieldCheck,
} from 'lucide-react'
import { createProduct, type AdminActionState } from '@/app/admin/actions'

const initialState: AdminActionState = {}

export default function NewProductPage() {
  const [state, formAction, pending] = useActionState(createProduct, initialState)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('music')
  const [fulfillment, setFulfillment] = useState('digital')

  const computedSlug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'nuevo-lanzamiento'

  const baseFolder = category === 'music' || fulfillment === 'digital' ? 'songs' : 'merch'
  const autoFolderPath = `/${baseFolder}/${computedSlug}/`

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
      <nav>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Productos
        </Link>
      </nav>

      <div className="border border-neutral-800/90 rounded-3xl p-6 sm:p-8 bg-neutral-950 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-500" />
              Nuevo Producto en el Catálogo (v1.0 CDN Vault)
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Al guardar, el sistema crea automáticamente el directorio exclusivo del producto y almacena todos sus másters.
            </p>
          </div>

          <div className="px-3.5 py-2 rounded-2xl bg-red-950/50 border border-red-900/60 text-xs font-mono shrink-0">
            <span className="text-[10px] uppercase text-red-400 font-bold flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5" /> Directorio Automático
            </span>
            <span className="text-white font-bold block mt-0.5">public{autoFolderPath}</span>
          </div>
        </div>

        <form action={formAction} className="space-y-6">
          {/* General Information */}
          <div className="space-y-4 p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-red-400">
              1. Información General & Clasificación
            </h2>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">Nombre del Producto *</label>
              <input
                type="text"
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Criss Angel (Edición Digital) o Sleepyred Neon Hoodie"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">Categoría</label>
                <select
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 cursor-pointer font-sans"
                >
                  <option value="music">Música (Crea /songs/&lt;slug&gt;)</option>
                  <option value="merch">Merch / Ropa (Crea /merch/&lt;slug&gt;)</option>
                  <option value="poster">Póster / Arte</option>
                  <option value="bundle">Bundle / Paquete</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">Tipo de Entrega</label>
                <select
                  name="fulfillment"
                  value={fulfillment}
                  onChange={(e) => setFulfillment(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 cursor-pointer font-sans"
                >
                  <option value="digital">Digital (Descarga directa / Bóveda)</option>
                  <option value="physical">Físico (Envío por mensajería)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">Precio USD *</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  required
                  placeholder="12.00"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">Descripción del Producto</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Detalla las características del lanzamiento, formatos incluidos o especificaciones..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-sans"
              />
            </div>
          </div>

          {/* Media Assets Upload & Path Section */}
          <div className="space-y-4 p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                2. Subida Directa de Archivos al Directorio ({autoFolderPath})
              </h2>
              <span className="text-[11px] font-mono text-neutral-400">
                Sube el archivo desde tu PC o escribe una ruta existente
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cover HD */}
              <div className="space-y-2 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                <label className="block text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-pink-400" /> Portada HD (JPG / PNG / WebP)
                </label>
                <input
                  type="file"
                  name="cover_file"
                  accept="image/*"
                  className="block w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-950 file:text-red-300 hover:file:bg-red-900 cursor-pointer"
                />
                <input
                  type="text"
                  name="thumbnail_url"
                  placeholder={`O ruta manual: ${autoFolderPath}cover.jpg`}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
                />
              </div>

              {/* Audio MP3 Preview & 320k */}
              <div className="space-y-2 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                <label className="block text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-sky-400" /> Audio MP3 320k (Preview & Descarga)
                </label>
                <input
                  type="file"
                  name="mp3_file"
                  accept=".mp3,audio/mpeg"
                  className="block w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-950 file:text-red-300 hover:file:bg-red-900 cursor-pointer"
                />
                <input
                  type="text"
                  name="mp3_url"
                  placeholder={`O ruta manual: ${autoFolderPath}preview.mp3`}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
                />
              </div>

              {/* Master WAV */}
              <div className="space-y-2 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                <label className="block text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-emerald-400" /> Audio Máster .WAV (Sin compresión)
                </label>
                <input
                  type="file"
                  name="wav_file"
                  accept=".wav,audio/wav,audio/x-wav"
                  className="block w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-950 file:text-red-300 hover:file:bg-red-900 cursor-pointer"
                />
                <input
                  type="text"
                  name="wav_url"
                  placeholder={`O ruta manual: ${autoFolderPath}master.wav`}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
                />
              </div>

              {/* Vocal Acapella */}
              <div className="space-y-2 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                <label className="block text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-amber-400" /> Pista Vocal Acapella (.WAV / .MP3)
                </label>
                <input
                  type="file"
                  name="acapella_file"
                  accept=".wav,.mp3,audio/*"
                  className="block w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-950 file:text-red-300 hover:file:bg-red-900 cursor-pointer"
                />
                <input
                  type="text"
                  name="acapella_url"
                  placeholder={`O ruta manual: ${autoFolderPath}acapella.wav`}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
                />
              </div>

              {/* Instrumental */}
              <div className="space-y-2 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                <label className="block text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-red-400" /> Pista Instrumental (.WAV / .MP3)
                </label>
                <input
                  type="file"
                  name="instrumental_file"
                  accept=".wav,.mp3,audio/*"
                  className="block w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-950 file:text-red-300 hover:file:bg-red-900 cursor-pointer"
                />
                <input
                  type="text"
                  name="instrumental_url"
                  placeholder={`O ruta manual: ${autoFolderPath}instrumental.wav`}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
                />
              </div>

              {/* Video URL */}
              <div className="space-y-2 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex flex-col justify-between">
                <label className="block text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-purple-400" /> Vídeo Oficial de Lanzamiento (Embed / URL)
                </label>
                <p className="text-[11px] text-neutral-500">
                  Enlace de YouTube Embed o vídeo directo para los compradores en la Biblioteca.
                </p>
                <input
                  type="text"
                  name="video_url"
                  placeholder="https://www.youtube.com/embed/..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/90 border border-neutral-800/80 flex items-center gap-2.5 text-[11px] text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-red-500 shrink-0" />
              <span>
                Los archivos máster (WAV, Acapella, Instrumental) se vinculan automáticamente al verificador de propiedad en <code className="text-red-400">/api/media/download</code> para que solo usuarios autorizados puedan descargarlos.
              </span>
            </div>
          </div>

          {state?.error && <p className="text-xs text-red-400 font-semibold">{state.error}</p>}

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-all cursor-pointer shadow-md disabled:opacity-60"
            >
              <FolderPlus className="w-4 h-4" />
              <span>
                {pending
                  ? 'Creando carpeta y subiendo archivos…'
                  : `Crear Carpeta ${autoFolderPath} y Publicar Producto`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
