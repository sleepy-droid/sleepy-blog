'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, ShieldCheck } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useLanguage } from '@/lib/i18n'
import { formatPrice } from '@/lib/types'

export function CartDrawer() {
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, totalCents, totalItemsCount } = useCart()
  const { t } = useLanguage()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop Overlay */}
      <div
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-neutral-950 border-l border-neutral-800 shadow-2xl flex flex-col justify-between">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                {t('cart_title')} ({totalItemsCount})
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <ShoppingBag className="w-12 h-12 text-neutral-700 mx-auto stroke-1" />
                <p className="text-sm text-neutral-400 font-medium">{t('cart_empty')}</p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 underline cursor-pointer"
                >
                  {t('back_to_shop')}
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800/80"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0">
                    {item.product.thumbnail_url ? (
                      <Image
                        src={item.product.thumbnail_url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600">
                        Sin foto
                      </div>
                    )}
                  </div>

                  {/* Product Details & Variant */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-xs font-bold text-white truncate">{item.product.name}</h3>
                    <p className="text-[11px] font-mono text-neutral-400">
                      Variante: <span className="text-red-400 font-bold">{item.variantLabel}</span>
                    </p>
                    <p className="text-xs font-mono font-bold text-white">
                      {formatPrice(item.product.price_cents * item.quantity, item.product.currency)}
                    </p>
                  </div>

                  {/* Quantity Controls & Remove */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                      title="Eliminar del carrito"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-1 text-xs">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:text-red-400 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:text-red-400 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Checkout Button */}
          {items.length > 0 && (
            <div className="p-6 border-t border-neutral-800 space-y-4 bg-neutral-950">
              <div className="flex items-center justify-between text-sm font-bold font-mono">
                <span className="text-neutral-400">Total:</span>
                <span className="text-xl text-red-400">{formatPrice(totalCents)}</span>
              </div>

              <Link
                href="/checkout"
                onClick={() => setIsOpen(false)}
                className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-600 border border-red-500/40 shadow-lg shadow-red-950 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('cart_checkout')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                <span>Transacción segura y encriptada</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
