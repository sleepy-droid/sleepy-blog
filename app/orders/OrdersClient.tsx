'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Receipt,
  Headphones,
  ShoppingBag,
  Sparkles,
} from 'lucide-react'
import { formatPrice, type Product } from '@/lib/types'
import { updateOrderStatusAction } from '@/app/checkout/actions'

export type OrderReceiptItem = {
  id: string
  order_id: string
  product_id: string
  variant_label: string
  quantity: number
  unit_price_cents: number
  product: Product | null
}

export type OrderReceipt = {
  id: string
  status: 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
  total_cents: number
  currency: string
  shipping_address: string | null
  billing_info: string | null
  notes: string | null
  created_at: string
  items: OrderReceiptItem[]
}

type OrdersClientProps = {
  receipts: OrderReceipt[]
  isAdmin: boolean
}

export function OrdersClient({ receipts, isAdmin }: OrdersClientProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'physical' | 'digital'>('all')
  const [isUpdating, startTransition] = useTransition()

  const filteredReceipts = receipts.filter((r) => {
    if (filter === 'all') return true
    const hasPhysical = r.items.some((i) => i.product?.fulfillment === 'physical')
    if (filter === 'physical') return hasPhysical
    return !hasPhysical
  })

  const getStepIndex = (status: OrderReceipt['status']) => {
    if (status === 'delivered' || status === 'completed') return 3
    if (status === 'shipped') return 2
    return 1
  }

  const handleStatusChange = (orderId: string, newStatus: string) => {
    const fd = new FormData()
    fd.set('order_id', orderId)
    fd.set('status', newStatus)
    startTransition(async () => {
      await updateOrderStatusAction(fd)
      router.refresh()
    })
  }

  if (receipts.length === 0) {
    return (
      <div className="p-10 rounded-3xl border border-neutral-800/80 bg-neutral-950/60 text-center space-y-4">
        <Receipt className="w-12 h-12 text-neutral-600 mx-auto" />
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white">Aún no tienes recibos de compra registrados</h2>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Cuando realices un pedido con uno o varios artículos en la tienda oficial, verás aquí tu recibo consolidado y el seguimiento de envío paso a paso.
          </p>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-colors shadow-lg"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Ir a la Tienda Oficial</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros de Recibos */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-neutral-900/80 p-1.5 rounded-2xl border border-neutral-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-red-700 text-white font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Todos los Recibos ({receipts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('physical')}
            className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
              filter === 'physical'
                ? 'bg-red-700 text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Envíos Físicos
          </button>
          <button
            type="button"
            onClick={() => setFilter('digital')}
            className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
              filter === 'digital'
                ? 'bg-red-700 text-white font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Solo Digitales
          </button>
        </div>
      </div>

      {/* Lista de Recibos Consolidados */}
      <div className="space-y-6">
        {filteredReceipts.map((receipt) => {
          const hasPhysicalItems = receipt.items.some(
            (i) => i.product?.fulfillment === 'physical'
          )
          const step = getStepIndex(receipt.status)
          const totalUnits = receipt.items.reduce((acc, i) => acc + (i.quantity || 1), 0)

          return (
            <article
              key={receipt.id}
              className="rounded-3xl border border-neutral-800/90 bg-neutral-950/80 overflow-hidden shadow-2xl space-y-5 p-5 sm:p-6"
            >
              {/* Cabecera del Recibo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-neutral-900 border border-neutral-700 text-white">
                      <Receipt className="w-3.5 h-3.5 text-red-400" />
                      Recibo #{receipt.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-red-950/60 border border-red-900/50 text-red-300">
                      {receipt.items.length} {receipt.items.length === 1 ? 'producto' : 'productos'} ({totalUnits} uds)
                    </span>
                  </div>
                  <p className="text-xs font-mono text-neutral-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    Emitido el{' '}
                    {new Date(receipt.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {isAdmin && (
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="text-neutral-500">Estado Admin:</span>
                      <select
                        disabled={isUpdating}
                        value={receipt.status}
                        onChange={(e) => handleStatusChange(receipt.id, e.target.value)}
                        className="bg-neutral-900 border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-red-500 cursor-pointer"
                      >
                        <option value="processing">Procesando</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregado</option>
                      </select>
                    </div>
                  )}

                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                      Total del Recibo
                    </span>
                    <span className="text-lg font-extrabold font-mono text-red-400">
                      {formatPrice(receipt.total_cents, receipt.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra Visual de Seguimiento de Orden Física (3 etapas) */}
              {hasPhysicalItems ? (
                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-amber-400" />
                      Seguimiento de Envío Físico
                    </span>
                    <span className="font-mono text-[11px] text-amber-300">
                      {step === 1 && 'Etapa 1/3: Preparando paquete en estudio'}
                      {step === 2 && 'Etapa 2/3: En tránsito hacia tu dirección'}
                      {step === 3 && 'Etapa 3/3: Paquete entregado'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div
                      className={`p-2.5 rounded-xl border text-center space-y-1 ${
                        step >= 1
                          ? 'bg-amber-950/50 border-amber-600/60 text-amber-200'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                      }`}
                    >
                      <Package className="w-4 h-4 mx-auto" />
                      <p className="text-[11px] font-mono font-bold">1. Procesando</p>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border text-center space-y-1 ${
                        step >= 2
                          ? 'bg-yellow-950/50 border-yellow-500/60 text-yellow-200'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                      }`}
                    >
                      <Truck className="w-4 h-4 mx-auto" />
                      <p className="text-[11px] font-mono font-bold">2. Enviado</p>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border text-center space-y-1 ${
                        step >= 3
                          ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 mx-auto" />
                      <p className="text-[11px] font-mono font-bold">3. Entregado</p>
                    </div>
                  </div>

                  {receipt.shipping_address && (
                    <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-2 text-xs text-neutral-300 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>Destino de envío: {receipt.shipping_address}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-4 py-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between text-xs text-emerald-300">
                  <span className="flex items-center gap-2 font-semibold">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Entrega Digital Instantánea — Todos los másters están activos en tu Reproductor Web y Biblioteca
                  </span>
                </div>
              )}

              {/* Desglose de Artículos en este Recibo */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                  Artículos incluidos en este recibo ({receipt.items.length}):
                </h3>

                <div className="divide-y divide-neutral-800/80 rounded-2xl border border-neutral-800/80 bg-neutral-900/30 overflow-hidden">
                  {receipt.items.map((item) => {
                    const prod = item.product
                    const isPhysical = prod?.fulfillment === 'physical'
                    const lineTotal = (item.unit_price_cents || prod?.price_cents || 0) * (item.quantity || 1)

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0">
                            {prod?.thumbnail_url ? (
                              <Image
                                src={prod.thumbnail_url}
                                alt={prod.name}
                                fill
                                unoptimized={prod.thumbnail_url.endsWith('.svg')}
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-neutral-500">
                                Ítem
                              </div>
                            )}
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-white truncate">
                                {prod?.name || 'Artículo Oficial'}
                              </p>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  isPhysical
                                    ? 'bg-amber-950/70 text-amber-300 border border-amber-700/50'
                                    : 'bg-red-950/70 text-red-300 border border-red-800/50'
                                }`}
                              >
                                {isPhysical ? 'Físico / Envío' : 'Digital / Audio'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-400">
                              <span>
                                Variante/Talla: <strong className="text-neutral-200">{item.variant_label}</strong>
                              </span>
                              <span>
                                Cantidad: <strong className="text-neutral-200">x{item.quantity}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
                          {!isPhysical && prod && (
                            <Link
                              href={`/player?track=${encodeURIComponent(prod.id)}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-200 bg-neutral-900 border border-neutral-700 hover:border-red-600 hover:text-white transition-colors"
                            >
                              <Headphones className="w-3.5 h-3.5 text-red-400" />
                              <span>Reproducir</span>
                            </Link>
                          )}

                          <span className="text-xs font-mono font-bold text-white">
                            {formatPrice(lineTotal, receipt.currency)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
