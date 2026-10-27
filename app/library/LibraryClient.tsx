'use client'

import { useState } from 'react'
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
  Award,
  Headphones,
  Receipt,
} from 'lucide-react'
import type { LibraryItem, Product } from '@/lib/types'

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

export function LibraryClient({ digitalItems, physicalOrders }: LibraryClientProps) {
  const [openDownloadId, setOpenDownloadId] = useState<string | null>(null)

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
      {/* SECTION 1: Vitrina de Trofeos Musicales Digitales */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Trofeos Musicales & Másters Digitales ({digitalItems.length})
            </h2>
          </div>

          <Link
            href="/player"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-red-400 hover:text-red-300"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Ir a la Consola del Reproductor Web →</span>
          </Link>
        </div>

        {digitalItems.length === 0 ? (
          <div className="p-8 rounded-2xl border border-neutral-800/80 bg-neutral-950/60 text-center space-y-3">
            <Music className="w-10 h-10 text-neutral-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">
                Aún no tienes trofeos digitales en tu vitrina
              </p>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Cuando adquieras canciones, másters WAV o paquetes de acapellas en la tienda oficial, aparecerán aquí como trofeos desbloqueados con descarga ilimitada.
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

              return (
                <div
                  key={item.id}
                  className="border border-amber-500/30 bg-gradient-to-br from-neutral-950 via-neutral-900/80 to-amber-950/15 hover:border-amber-500/60 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-neutral-900 border border-amber-500/40 shrink-0 shadow-md">
                        {item.product.thumbnail_url ? (
                          <Image
                            src={item.product.thumbnail_url}
                            alt={item.product.name}
                            fill
                            unoptimized={item.product.thumbnail_url.endsWith('.svg')}
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-amber-400">
                            <Award className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-700/50">
                            Trofeo #{idx + 1}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {item.source === 'admin_grant'
                              ? 'Catálogo Creador'
                              : new Date(item.created_at).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold text-white truncate">
                          {item.product.name}
                        </h3>
                        <p className="text-[11px] text-neutral-400 line-clamp-1">
                          {item.product.description || 'Máster Oficial Desbloqueado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-800/80">
                    <Link
                      href={`/player?track=${pid}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 transition-all shadow-md"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      <span>Escuchar en Reproductor Web</span>
                    </Link>

                    {/* Authenticated Download Menu Dropdown via /api/media/download */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenDownloadId(isMenuOpen ? null : item.id)}
                        className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                        title="Opciones de descarga verificada"
                      >
                        <Download className="w-3.5 h-3.5 text-red-400" />
                        <span>Descargar</span>
                        <ChevronDown className="w-3 h-3 text-neutral-500" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-52 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-1.5 z-20 space-y-1 text-xs font-mono">
                          {(item.product.mp3_url || item.product.audio_preview_url) && (
                            <a
                              href={`/api/media/download?productId=${pid}&asset=mp3`}
                              className="block w-full px-3 py-2 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors"
                            >
                              🎵 Descargar MP3 320k
                            </a>
                          )}
                          {(item.product.wav_url ||
                            item.product.mp3_url ||
                            item.product.audio_preview_url) && (
                            <a
                              href={`/api/media/download?productId=${pid}&asset=wav`}
                              className="block w-full px-3 py-2 rounded-lg hover:bg-neutral-900 text-red-400 hover:text-red-300 font-bold transition-colors"
                            >
                              💿 Descargar WAV Máster
                            </a>
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
                    <h3 className="text-sm font-bold text-white">{order.product.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-400">
                      <span>
                        Talla/Variante: <strong className="text-white">{order.variantLabel}</strong>
                      </span>
                      <span>
                        Cantidad: <strong className="text-white">{order.quantity}</strong>
                      </span>
                      {order.orderId && (
                        <span>
                          Recibo: <strong className="text-neutral-300">#{order.orderId.slice(0, 8).toUpperCase()}</strong>
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
