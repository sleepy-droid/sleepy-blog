'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Download,
  Music,
  Package,
  Check,
  ChevronDown,
  ShoppingBag,
  Mic,
  Sliders,
  Library,
  Headphones,
  Receipt,
  Disc,
  Play,
  Pause,
  PictureInPicture2,
  ListPlus,
} from 'lucide-react'
import type { LibraryItem, Product } from '@/lib/types'
import {
  useGlobalPlayer,
  productToPlayerTracks,
  type PlayerTrack,
} from '@/lib/player-context'

export type PhysicalOrderType = {
  id: string
  orderId?: string
  product: Product
  variantLabel: string
  quantity: number
  status: 'processing' | 'shipped' | 'delivered'
  created_at: string
}

type LibraryClientProps = {
  digitalItems: Array<LibraryItem & { product: Product }>
  physicalOrders: PhysicalOrderType[]
}

export function LibraryClient({
  digitalItems,
  physicalOrders,
}: LibraryClientProps) {
  const [openDownloadId, setOpenDownloadId] = useState<string | null>(null)
  const [queuedFeedbackId, setQueuedFeedbackId] = useState<string | null>(null)
  const {
    activeTrack,
    isPlaying,
    isPiPActive,
    selectAndPlayTrack,
    togglePiP,
    addToQueue,
    setIsMinimized,
  } = useGlobalPlayer()

  // Build full unlocked queue from all digital library items
  const allLibraryTracks = useMemo(() => {
    const list: PlayerTrack[] = []
    for (const item of digitalItems) {
      list.push(...productToPlayerTracks(item.product, true))
    }
    return list
  }, [digitalItems])

  const getStatusBadge = (status: PhysicalOrderType['status']) => {
    switch (status) {
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-800/80">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Procesando
          </span>
        )
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-yellow-950/80 text-yellow-400 border border-yellow-800/80">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
            Enviado
          </span>
        )
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <Check className="w-3.5 h-3.5" />
            Entregado
          </span>
        )
    }
  }

  return (
    <div className="space-y-12">
      {/* SECTION 1: Biblioteca de Lanzamientos Musicales Digitales */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Lanzamientos Musicales, Álbumes & Másters Digitales (
              {digitalItems.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {activeTrack && (
              <button
                type="button"
                onClick={togglePiP}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer ${
                  isPiPActive
                    ? 'bg-red-700 text-white border-red-400'
                    : 'bg-red-950/70 text-red-300 border-red-800/70 hover:bg-red-900/60 hover:text-white'
                }`}
                title="Abrir reproductor en ventana flotante Picture-in-Picture"
              >
                <PictureInPicture2 className="w-3.5 h-3.5" />
                <span>
                  {isPiPActive ? 'PiP Flotante Activo' : 'Activar Modo PiP'}
                </span>
              </button>
            )}

            <Link
              href="/player"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-red-400 hover:text-red-300"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Ir a la Consola del Reproductor Web →</span>
            </Link>
          </div>
        </div>

        {digitalItems.length === 0 ? (
          <div className="p-8 rounded-2xl border border-neutral-800/80 bg-neutral-950/60 text-center space-y-3">
            <Music className="w-10 h-10 text-neutral-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">
                Aún no tienes lanzamientos digitales en tu biblioteca
              </p>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Cuando adquieras canciones, álbumes WAV o paquetes de acapellas
                en la tienda oficial, aparecerán aquí en tu biblioteca con
                descarga ilimitada.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-colors shadow-md"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Explorar Catálogo Musical</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {digitalItems.map((item, idx) => {
              const isMenuOpen = openDownloadId === item.id
              const pid = encodeURIComponent(item.product.id)
              const itemTracks = productToPlayerTracks(item.product, true)
              const primaryTrack = itemTracks[0]
              const isItemActive = itemTracks.some(
                (t) => t.id === activeTrack?.id
              )
              const isItemPlaying = isItemActive && isPlaying

              const wavFiles = (item.product.folder_stats?.files || []).filter(
                (f) =>
                  f.extension === '.wav' &&
                  !f.name.toLowerCase().includes('acapella') &&
                  !f.name.toLowerCase().includes('instrumental')
              )
              const mp3Files = (item.product.folder_stats?.files || []).filter(
                (f) => f.extension === '.mp3'
              )
              const isAlbum = wavFiles.length > 1 || mp3Files.length > 1

              const handlePlayPrimary = () => {
                if (!primaryTrack) return
                const targetTrack =
                  isItemActive && activeTrack ? activeTrack : primaryTrack
                selectAndPlayTrack(targetTrack, 'master', allLibraryTracks)
              }

              return (
                <div
                  key={item.id}
                  className={`border bg-gradient-to-br from-neutral-950 via-neutral-900/80 to-red-950/15 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all shadow-lg ${
                    isItemActive
                      ? 'border-red-600/80 shadow-red-950/40'
                      : 'border-neutral-800/90 hover:border-red-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        type="button"
                        onClick={handlePlayPrimary}
                        className="group relative w-14 h-14 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0 shadow-md cursor-pointer"
                        title={
                          isItemPlaying
                            ? 'Pausar reproducción'
                            : 'Reproducir ahora'
                        }
                      >
                        {item.product.thumbnail_url ? (
                          <Image
                            src={item.product.thumbnail_url}
                            alt={item.product.name}
                            fill
                            unoptimized={item.product.thumbnail_url.endsWith(
                              '.svg'
                            )}
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-red-400">
                            <Library className="w-6 h-6" />
                          </div>
                        )}
                        <div
                          className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                            isItemActive
                              ? 'opacity-100'
                              : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {isItemPlaying ? (
                            <Pause className="w-5 h-5 text-white fill-current" />
                          ) : (
                            <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                          )}
                        </div>
                      </button>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950/80 text-red-300 border border-red-800/50">
                            {isAlbum
                              ? `Álbum • ${Math.max(
                                  wavFiles.length,
                                  mp3Files.length
                                )} pistas`
                              : ` Ítem #${idx + 1}`}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {item.source === 'admin_grant'
                              ? 'Catálogo Creador'
                              : new Date(item.created_at).toLocaleDateString(
                                  'es-ES'
                                )}
                          </span>
                        </div>
                        <Link
                          href={`/player?track=${pid}`}
                          onClick={() => {
                            setIsMinimized(false)
                            if (!isItemActive && primaryTrack) {
                              selectAndPlayTrack(
                                primaryTrack,
                                'master',
                                allLibraryTracks
                              )
                            }
                          }}
                          className="block group/title"
                          title="Haz clic en la canción para abrirla en el Web Player"
                        >
                          <h3 className="text-sm font-extrabold text-white group-hover/title:text-red-300 truncate transition-colors">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-[11px] text-neutral-400 line-clamp-1">
                          {item.product.description ||
                            'Máster Oficial Desbloqueado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isAlbum && (
                    <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold flex items-center gap-1">
                        <Disc className="w-3 h-3" /> Tracklist incluido en este
                        álbum:
                      </span>
                      <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                        {(wavFiles.length > 0 ? wavFiles : mp3Files).map(
                          (file, tIdx) => {
                            const trackObj =
                              itemTracks[tIdx] || primaryTrack
                            const isSubPlaying =
                              activeTrack?.id === trackObj?.id && isPlaying
                            return (
                              <div
                                key={file.name}
                                className="flex items-center justify-between gap-2 text-[11px] font-mono text-neutral-300 bg-neutral-900/70 px-2.5 py-1 rounded-lg"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    trackObj &&
                                    selectAndPlayTrack(
                                      trackObj,
                                      'master',
                                      allLibraryTracks
                                    )
                                  }
                                  className="flex items-center gap-1.5 truncate text-left hover:text-white cursor-pointer"
                                >
                                  {isSubPlaying ? (
                                    <Pause className="w-3 h-3 text-red-400 shrink-0 fill-current" />
                                  ) : (
                                    <Play className="w-3 h-3 text-red-400 shrink-0 fill-current" />
                                  )}
                                  <span className="truncate">
                                    {tIdx + 1}. {file.title || file.name}
                                  </span>
                                </button>
                                <a
                                  href={`/api/media/download?productId=${pid}&asset=${
                                    file.extension === '.mp3' ? 'mp3' : 'wav'
                                  }&file=${encodeURIComponent(file.name)}`}
                                  className="text-red-400 hover:text-red-300 font-bold shrink-0"
                                >
                                  Descargar {file.extension.toUpperCase()}
                                </a>
                              </div>
                            )
                          }
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-800/80">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePlayPrimary}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 transition-all shadow-md cursor-pointer"
                      >
                        {isItemPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Pausar</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Reproducir Aquí</span>
                          </>
                        )}
                      </button>

                      {primaryTrack && (
                        <button
                          type="button"
                          onClick={() => {
                            for (const tr of itemTracks) {
                              addToQueue(tr)
                            }
                            setQueuedFeedbackId(item.id)
                            setTimeout(() => {
                              setQueuedFeedbackId((prev) =>
                                prev === item.id ? null : prev
                              )
                            }, 1800)
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-mono font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-red-800/60 transition-all cursor-pointer"
                          title="Añadir canción(es) a la cola de reproducción"
                        >
                          {queuedFeedbackId === item.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">En Cola</span>
                            </>
                          ) : (
                            <>
                              <ListPlus className="w-3.5 h-3.5 text-red-400" />
                              <span>+ Cola</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (!isItemActive && primaryTrack) {
                            selectAndPlayTrack(
                              primaryTrack,
                              'master',
                              allLibraryTracks
                            )
                          }
                          togglePiP()
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-mono font-bold bg-neutral-900 border border-neutral-800 text-red-300 hover:text-white hover:border-red-700 transition-all cursor-pointer"
                        title="Reproducir en ventana flotante Picture-in-Picture (no se corta al cambiar de ventana)"
                      >
                        <PictureInPicture2 className="w-3.5 h-3.5" />
                        <span>PiP</span>
                      </button>

                      <Link
                        href={`/player?track=${pid}`}
                        onClick={() => setIsMinimized(false)}
                        className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-neutral-300 bg-neutral-900 border border-neutral-800 hover:text-white transition-all"
                        title="Abrir en Consola del Reproductor Web"
                      >
                        <Headphones className="w-3.5 h-3.5 text-red-400" />
                        <span className="hidden sm:inline">Consola</span>
                      </Link>
                    </div>

                    {/* Authenticated Download Menu Dropdown via /api/media/download */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenDownloadId(isMenuOpen ? null : item.id)
                        }
                        className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                        title="Opciones de descarga verificada"
                      >
                        <Download className="w-3.5 h-3.5 text-red-400" />
                        <span>Descargar</span>
                        <ChevronDown className="w-3 h-3 text-neutral-500" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-60 max-h-64 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-1.5 z-20 space-y-1 text-xs font-mono">
                          {wavFiles.length > 1 ? (
                            wavFiles.map((wf, wIdx) => (
                              <a
                                key={wf.name}
                                href={`/api/media/download?productId=${pid}&asset=wav&file=${encodeURIComponent(
                                  wf.name
                                )}`}
                                className="block w-full px-3 py-2 rounded-lg hover:bg-neutral-900 text-red-400 hover:text-red-300 font-bold transition-colors truncate"
                              >
                                💿 {wIdx + 1}. {wf.title || wf.name} (WAV)
                              </a>
                            ))
                          ) : (
                            (item.product.wav_url ||
                              item.product.mp3_url ||
                              item.product.audio_preview_url) && (
                              <a
                                href={`/api/media/download?productId=${pid}&asset=wav`}
                                className="block w-full px-3 py-2 rounded-lg hover:bg-neutral-900 text-red-400 hover:text-red-300 font-bold transition-colors"
                              >
                                💿 Descargar WAV Máster
                              </a>
                            )
                          )}

                          {mp3Files.length > 1 ? (
                            mp3Files.map((mf, mIdx) => (
                              <a
                                key={mf.name}
                                href={`/api/media/download?productId=${pid}&asset=mp3&file=${encodeURIComponent(
                                  mf.name
                                )}`}
                                className="block w-full px-3 py-2 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors truncate"
                              >
                                🎵 {mIdx + 1}. {mf.title || mf.name} (MP3)
                              </a>
                            ))
                          ) : (
                            (item.product.mp3_url ||
                              item.product.audio_preview_url) && (
                              <a
                                href={`/api/media/download?productId=${pid}&asset=mp3`}
                                className="block w-full px-3 py-2 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors"
                              >
                                🎵 Descargar MP3 320k
                              </a>
                            )
                          )}

                          {item.product.acapella_url && (
                            <a
                              href={`/api/media/download?productId=${pid}&asset=acapella`}
                              className="flex items-center gap-1.5 w-full px-3 py-2 rounded-lg hover:bg-neutral-900 text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                            >
                              <Mic className="w-3.5 h-3.5" />
                              <span>Descargar Acapella</span>
                            </a>
                          )}
                          {item.product.instrumental_url && (
                            <a
                              href={`/api/media/download?productId=${pid}&asset=instrumental`}
                              className="flex items-center gap-1.5 w-full px-3 py-2 rounded-lg hover:bg-neutral-900 text-sky-400 hover:text-sky-300 font-semibold transition-colors"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>Descargar Instrumental</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: Colección de Prendas & Enlace a Recibos Consolidados */}
      <section className="space-y-4 pt-4 border-t border-neutral-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Coleccionables Físicos & Prendas ({physicalOrders.length})
            </h2>
          </div>

          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 hover:text-amber-300"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Ver Recibos Consolidados y Seguimiento →</span>
          </Link>
        </div>

        {physicalOrders.length === 0 ? (
          <div className="p-6 rounded-2xl border border-neutral-800/80 bg-neutral-950/40 text-center space-y-3">
            <p className="text-xs text-neutral-400">
              No tienes coleccionables físicos registrados aún.
            </p>
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-200 bg-neutral-900 border border-neutral-800 hover:text-white"
            >
              <Receipt className="w-3.5 h-3.5 text-red-400" />
              <span>Revisar Historial de Recibos en Mis Pedidos</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {physicalOrders.map((order) => (
              <div
                key={order.id}
                className="border border-neutral-800/80 bg-neutral-950/60 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                    {order.product.thumbnail_url ? (
                      <Image
                        src={order.product.thumbnail_url}
                        alt={order.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600">
                        Prenda
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">
                      {order.product.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-400">
                      <span>
                        Talla/Variante:{' '}
                        <strong className="text-white">
                          {order.variantLabel}
                        </strong>
                      </span>
                      <span>
                        Cantidad:{' '}
                        <strong className="text-white">{order.quantity}</strong>
                      </span>
                      {order.orderId && (
                        <span>
                          Recibo:{' '}
                          <strong className="text-neutral-300">
                            #{order.orderId.slice(0, 8).toUpperCase()}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                  {getStatusBadge(order.status)}
                  <Link
                    href="/orders"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-200 bg-neutral-900 border border-neutral-800 hover:border-red-700 hover:text-white transition-colors"
                  >
                    Rastrear Recibo
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
