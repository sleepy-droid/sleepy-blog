'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ShieldCheck, ArrowLeft } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useLanguage } from '@/lib/i18n'
import { formatPrice } from '@/lib/types'

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalCents, totalItemsCount } = useCart()
  const { t } = useLanguage()

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      <header className="border-b border-neutral-800/80 pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-red-500" />
            {t('cart_title')}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Revisa tus productos seleccionados antes de proceder al pago.
          </p>
        </div>

        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-red-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back_to_shop')}</span>
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="p-16 text-center border border-neutral-800 rounded-3xl bg-neutral-900/20 space-y-4">
          <ShoppingBag className="w-14 h-14 text-neutral-700 mx-auto stroke-1" />
          <p className="text-base text-neutral-300 font-medium">{t('cart_empty')}</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-all shadow-md"
          >
            <span>Explorar Productos</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-neutral-800/80 bg-neutral-900/40 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0">
                    {item.product.thumbnail_url ? (
                      <Image
                        src={item.product.thumbnail_url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600">
                        Sin portada
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-900/40">
                      {item.product.category}
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">{item.product.name}</h2>
                    <p className="text-xs font-mono text-neutral-400">
                      Talla / Variante: <span className="text-white font-bold">{item.variantLabel}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                  <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-xl p-1 text-xs">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 hover:text-red-400 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 hover:text-red-400 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-sm font-mono font-bold text-red-400">
                    {formatPrice(item.product.price_cents * item.quantity, item.product.currency)}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
                    title="Eliminar ítem"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4 border border-neutral-800/90 rounded-2xl p-6 bg-neutral-950 space-y-6 shadow-2xl">
            <h2 className="text-base font-bold text-white border-b border-neutral-800 pb-3">
              Resumen del Pedido
            </h2>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal ({totalItemsCount} ítems):</span>
                <span className="text-white font-bold">{formatPrice(totalCents)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Envío / Entrega Digital:</span>
                <span className="text-emerald-400 font-bold">GRATIS</span>
              </div>
              <div className="pt-3 border-t border-neutral-800 flex justify-between text-sm font-bold text-white">
                <span>Total a pagar:</span>
                <span className="text-red-400 text-lg">{formatPrice(totalCents)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-600 border border-red-500/40 shadow-lg shadow-red-950 transition-all flex items-center justify-center gap-2"
            >
              <span>{t('cart_checkout')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 text-center">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <span>Garantía de reembolso y entrega inmediata en tu biblioteca.</span>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
