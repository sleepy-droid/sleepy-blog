'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Lock,
  Sparkles,
  Loader2,
  MapPin,
  Package,
  Award,
  Headphones,
  UserCheck,
} from 'lucide-react'
import { useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/types'
import { placeOrderAction } from './actions'

export type CheckoutAccountUser = {
  id: string
  name: string
  email: string
  username?: string | null
  avatarUrl?: string | null
}

export function CheckoutClient({ accountUser }: { accountUser: CheckoutAccountUser }) {
  const router = useRouter()
  const { items, totalCents, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [useSavedAddress, setUseSavedAddress] = useState(true)

  const [shippingData, setShippingData] = useState({
    address: 'Calle 123 # 45 - 67, Apt 402',
    city: 'Ciudad de Panamá',
    country: 'Panamá',
  })

  const hasPhysical = items.some((item) => item.product.fulfillment === 'physical')
  const initial = accountUser.name.charAt(0).toUpperCase() || 'U'

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setCheckoutError(null)
    setIsSubmitting(true)

    try {
      const res = await placeOrderAction({
        shippingAddress: hasPhysical ? shippingData.address : undefined,
        city: hasPhysical ? shippingData.city : undefined,
        country: hasPhysical ? shippingData.country : undefined,
        totalCents,
        items: items.map((item) => ({
          productId: item.product.id,
          variantLabel: item.variantLabel || 'Estándar',
          quantity: item.quantity,
          unitPriceCents: item.product.price_cents,
          fulfillment: item.product.fulfillment,
        })),
      })

      if (res.error) {
        setCheckoutError(res.error)
        setIsSubmitting(false)
        return
      }

      if (res.orderId) {
        setCompletedOrderId(res.orderId)
      }
      setIsSubmitting(false)
      setIsCompleted(true)
      clearCart()
      router.refresh()
    } catch {
      setCheckoutError('Ocurrió un error al registrar tu pedido.')
      setIsSubmitting(false)
    }
  }

  if (isCompleted) {
    return (
      <main className="max-w-2xl mx-auto p-6 sm:p-12 font-sans text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-neutral-900 border border-neutral-800 text-emerald-400">
            Recibo #{completedOrderId ? completedOrderId.slice(0, 8).toUpperCase() : 'CONFIRMADO'}
          </span>
          <h1 className="text-3xl font-extrabold text-white">¡Orden Confirmada y Recibo Generado!</h1>
          <p className="text-sm text-neutral-300 max-w-md mx-auto">
            Tu recibo fue vinculado a <strong className="text-white">{accountUser.email || accountUser.name}</strong>. Todos los artículos quedaron agrupados en <strong className="text-white">Mis Pedidos</strong>, tus trofeos en tu <strong className="text-amber-400">Biblioteca</strong> y tus pistas listas en el <strong className="text-red-400">Reproductor Web</strong>.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
          <Link
            href="/orders"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-all shadow-lg"
          >
            <Package className="w-4 h-4" />
            <span>Rastrear Recibo en Mis Pedidos</span>
          </Link>
          <Link
            href="/library"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-700/60 hover:bg-amber-900/60 transition-all"
          >
            <Award className="w-4 h-4" />
            <span>Ver Vitrina de Trofeos</span>
          </Link>
          <Link
            href="/player"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold text-neutral-200 bg-neutral-900 border border-neutral-800 hover:text-white transition-colors"
          >
            <Headphones className="w-4 h-4 text-red-400" />
            <span>Abrir Reproductor Web</span>
          </Link>
        </div>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="max-w-xl mx-auto p-8 font-sans text-center space-y-4">
        <p className="text-sm text-neutral-400">No hay productos en tu carrito para realizar el pago.</p>
        <Link href="/shop" className="text-xs font-bold text-red-400 hover:underline">
          Volver a la tienda
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      <header className="border-b border-neutral-800/80 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Lock className="w-5 h-5 text-red-500" />
            Finalizar Compra
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Tu compra se vinculará directamente a tu cuenta autenticada.
          </p>
        </div>

        <Link href="/cart" className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Volver al Carrito
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Checkout Form */}
        <form onSubmit={handlePay} className="lg:col-span-7 space-y-6">
          {/* Cuenta Autenticada & Datos de Entrega */}
          <div className="border border-neutral-800/80 bg-neutral-900/40 p-6 rounded-2xl space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-red-500" />
                Cuenta Titular del Recibo
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                SESIÓN ACTIVA
              </span>
            </div>

            {/* Tarjeta de Cuenta Extraída Automáticamente de la Sesión */}
            <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative w-11 h-11 rounded-full overflow-hidden border border-red-900/60 bg-neutral-900 shrink-0">
                  {accountUser.avatarUrl ? (
                    <Image
                      src={accountUser.avatarUrl}
                      alt={accountUser.name}
                      fill
                      unoptimized={accountUser.avatarUrl.endsWith('.svg')}
                      className="object-cover"
                      sizes="44px"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-bold text-red-300">
                      {initial}
                    </span>
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white truncate">{accountUser.name}</p>
                    {accountUser.username && (
                      <span className="text-xs font-mono text-neutral-400">
                        @{accountUser.username}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-neutral-400 truncate">
                    {accountUser.email}
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-block text-[10px] font-mono text-neutral-500 shrink-0">
                Vinculación automática
              </span>
            </div>

            {hasPhysical ? (
              <div className="space-y-4 pt-2 border-t border-neutral-800/80">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
                  <span className="text-neutral-400 font-bold block text-[11px]">
                    Opciones de Envío Físico:
                  </span>
                  <div className="space-y-1.5 font-mono">
                    <label className="flex items-center gap-2 text-neutral-200 cursor-pointer">
                      <input
                        type="radio"
                        name="address_option"
                        checked={useSavedAddress}
                        onChange={() => setUseSavedAddress(true)}
                        className="accent-red-600"
                      />
                      <span>Usar dirección predeterminada ({shippingData.address})</span>
                    </label>
                    <label className="flex items-center gap-2 text-neutral-200 cursor-pointer">
                      <input
                        type="radio"
                        name="address_option"
                        checked={!useSavedAddress}
                        onChange={() => setUseSavedAddress(false)}
                        className="accent-red-600"
                      />
                      <span>Editar dirección de envío físico</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    Dirección de Entrega Física
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label
                        htmlFor="shipping-address"
                        className="block text-xs font-medium text-neutral-300"
                      >
                        Dirección completa (Calle, edificio, apto)
                      </label>
                      <textarea
                        id="shipping-address"
                        name="address"
                        rows={2}
                        required
                        autoComplete="street-address"
                        placeholder="Dirección de residencia"
                        value={shippingData.address}
                        onChange={(e) =>
                          setShippingData({ ...shippingData, address: e.target.value })
                        }
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-sans resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label
                          htmlFor="shipping-city"
                          className="block text-xs font-medium text-neutral-300"
                        >
                          Ciudad
                        </label>
                        <input
                          id="shipping-city"
                          name="city"
                          type="text"
                          required
                          autoComplete="address-level2"
                          placeholder="Ciudad"
                          value={shippingData.city}
                          onChange={(e) =>
                            setShippingData({ ...shippingData, city: e.target.value })
                          }
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-sans"
                        />
                      </div>
                      <div className="space-y-1">
                        <label
                          htmlFor="shipping-country"
                          className="block text-xs font-medium text-neutral-300"
                        >
                          País
                        </label>
                        <input
                          id="shipping-country"
                          name="country"
                          type="text"
                          required
                          autoComplete="country-name"
                          placeholder="País"
                          value={shippingData.country}
                          onChange={(e) =>
                            setShippingData({ ...shippingData, country: e.target.value })
                          }
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-sans"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-800/40 flex items-center gap-2.5 text-xs text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Entrega Digital Instantánea — Tus canciones, másters WAV y stems se desbloquearán automáticamente en tu cuenta al confirmar.
                </span>
              </div>
            )}
          </div>

          <div className="border border-neutral-800/80 bg-neutral-900/40 p-6 rounded-2xl space-y-4 backdrop-blur-md">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <CreditCard className="w-4 h-4 text-red-500" />
              Método de Pago Simulado
            </h2>

            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-xs space-y-2 font-mono">
              <div className="flex items-center justify-between text-neutral-300">
                <span>Tarjeta de Crédito / Supabase Pay</span>
                <span className="text-emerald-400 font-bold">VERIFICADO</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Simulación de pago sin cobro real vinculado a {accountUser.email}.
              </p>
            </div>
          </div>

          {checkoutError && (
            <div className="p-3.5 rounded-xl border border-red-900/60 bg-red-950/40 text-xs text-red-300">
              {checkoutError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-600 active:scale-[0.99] border border-red-500/40 shadow-xl shadow-red-950 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Procesando pago seguro…</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-white" />
                <span>Pagar {formatPrice(totalCents)} y Desbloquear en mi Cuenta</span>
              </>
            )}
          </button>
        </form>

        {/* Summary Sidebar */}
        <div className="lg:col-span-5 border border-neutral-800/90 rounded-2xl p-6 bg-neutral-950 space-y-4 shadow-2xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-3">
            Detalle de la Compra ({items.length} ítems)
          </h2>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-neutral-900/40 p-2.5 rounded-xl border border-neutral-800/60"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-950 shrink-0">
                  {item.product.thumbnail_url && (
                    <Image
                      src={item.product.thumbnail_url}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-white truncate">{item.product.name}</h3>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    {item.variantLabel} x{item.quantity}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-red-400">
                  {formatPrice(item.product.price_cents * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-neutral-800 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal:</span>
              <span className="text-white font-bold">{formatPrice(totalCents)}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Envío:</span>
              <span className="text-emerald-400 font-bold">GRATIS</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-neutral-800/80">
              <span>Total Final:</span>
              <span className="text-red-400 text-base">{formatPrice(totalCents)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
