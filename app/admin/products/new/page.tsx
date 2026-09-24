'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Music, Image as ImageIcon, Video, Mic, Sliders } from 'lucide-react'
import { createProduct, type AdminActionState } from '@/app/admin/actions'

const initialState: AdminActionState = {}

export default function NewProductPage() {
  const [state, formAction, pending] = useActionState(createProduct, initialState)

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
      <nav>
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Volver a Productos
        </Link>
      </nav>

      <div className="border border-neutral-800/90 rounded-3xl p-6 sm:p-8 bg-neutral-950 space-y-6 shadow-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" />
            Nuevo Producto en el Catálogo (Música o Merch)
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Organiza los campos multimedia del lanzamiento: Portada HD, WAV, MP3, Vídeo, Acapella e Instrumental.
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          {/* General Information */}
          <div className="space-y-4 p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider text-red-400">
              Información General
            </h2>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">Nombre del Producto *</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Ej: Criss Angel (Edición Digital) o Sleepyred Neon Hoodie"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">Categoría</label>
                <select
                  name="category"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 cursor-pointer font-sans"
                >
                  <option value="music">Música</option>
                  <option value="merch">Merch / Ropa</option>
                  <option value="poster">Póster / Arte</option>
                  <option value="bundle">Bundle / Paquete</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300">Tipo de Entrega</label>
                <select
                  name="fulfillment"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 cursor-pointer font-sans"
                >
                  <option value="digital">Digital (Descarga directa)</option>
                  <option value="physical">Físico (Envío por correo)</option>
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
                placeholder="Detalla las características del lanzamiento..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-sans"
              />
            </div>
          </div>

          {/* Media Fields Section (Explicit User Request) */}
          <div className="space-y-4 p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <Music className="w-4 h-4" />
              Campos Multimedia del Producto (Media Assets)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-pink-400" /> Portada HD (Coverart Image URL / Path)
                </label>
                <input
                  type="text"
                  name="thumbnail_url"
                  placeholder="/songs/criss-angel/crissangel.jpg o https://..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-emerald-400" /> Audio Máster .WAV (Master WAV URL / Path)
                </label>
                <input
                  type="text"
                  name="wav_url"
                  placeholder="/songs/criss-angel/crissangel.wav o https://..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-sky-400" /> Audio MP3 320k (Preview & MP3 URL / Path)
                </label>
                <input
                  type="text"
                  name="mp3_url"
                  placeholder="/songs/criss-angel/crissangel.mp3 o https://..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-purple-400" /> Enlace a Vídeo de Lanzamiento (Video URL)
                </label>
                <input
                  type="text"
                  name="video_url"
                  placeholder="https://www.youtube.com/embed/..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-amber-400" /> Pista Vocal Acapella (Acapella URL / Path)
                </label>
                <input
                  type="text"
                  name="acapella_url"
                  placeholder="/songs/criss-angel/acapella.wav o https://..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-red-400" /> Pista Instrumental (Instrumental URL / Path)
                </label>
                <input
                  type="text"
                  name="instrumental_url"
                  placeholder="/songs/criss-angel/instrumental.wav o https://..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
                />
              </div>
            </div>
          </div>

          {state?.error && <p className="text-xs text-red-400">{state.error}</p>}

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-all cursor-pointer shadow-md disabled:opacity-60"
            >
              <span>{pending ? 'Guardando…' : 'Guardar y Publicar Producto'}</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
