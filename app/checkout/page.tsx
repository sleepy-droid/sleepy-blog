'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ShieldCheck, CreditCard, CheckCircle2, ArrowLeft, Lock, Sparkles, Loader2, User, AlertTriangle, MapPin } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/types'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalCents, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // Guest vs Logged-in state (Simulated check or prompt)
  const [isGuest, setIsGuest] = useState(false)
  const [useSavedAddress, setUseSavedAddress] = useState(true)

  const [formData, setFormData] = useState({
    name: 'Sleepy Member',
    email: 'member@sleepyred999.com',
    address: 'Calle 123 # 45 - 67, Apt 402',
    city: 'Bogotá',
    country: 'Colombia',
  })

  const hasPhysical = items.some((item) => item.product.fulfillment === 'physical')

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault()

    if (isGuest) {
      alert('Debes iniciar sesión para que tus compras se guarden en tu biblioteca personal.')
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsCompleted(true)
      clearCart()
    }, 1500)
  }

  if (isCompleted) {
    return (
      <main className="max-w-2xl mx-auto p-6 sm:p-12 font-sans text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white">¡Orden Confirmada y Procesando!</h1>
          <p className="text-sm text-neutral-300 max-w-md mx-auto">
            Tu pedido ha sido procesado. Tus canciones ya están desbloqueadas en tu biblioteca y tus prendas físicas han entrado en estado <strong className="text-amber-400">Procesando</strong>.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/library"
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-all shadow-lg"
          >
            Ver en mi Biblioteca
          </Link>
          <Link
            href="/shop"
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold text-neutral-300 bg-neutral-900 border border-neutral-800 hover:text-white transition-colors"
          >
            Volver a la Tienda
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
            Revisa tu resumen de orden e ingresa tus datos de envío.
          </p>
        </div>

        <Link href="/cart" className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Volver al Carrito
        </Link>
      </header>

      {/* Guest Warning Banner if Guest */}
      {isGuest && (
        <div className="bg-amber-950/80 border border-amber-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-amber-200 font-medium">
              Estás navegando como invitado. Para vincular esta compra a tu biblioteca personal y descargar archivos ilimitados, debes iniciar sesión.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/auth/login?next=/checkout"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/auth/register?next=/checkout"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-300 bg-neutral-900 border border-neutral-800 hover:text-white"
            >
              Registrarse
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Checkout Form */}
        <form onSubmit={handlePay} className="lg:col-span-7 space-y-6">
          
          {/* Address & Customer Info */}
          <div className="border border-neutral-800/80 bg-neutral-900/40 p-6 rounded-2xl space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-500" />
                Información de Cliente y Envío
              </h2>
              <button
                type="button"
                onClick={() => setIsGuest(!isGuest)}
                className="text-[11px] text-neutral-400 hover:text-white font-mono underline"
              >
                {isGuest ? 'Modo Miembro' : 'Probar como Invitado'}
              </button>
            </div>

            {/* Saved Address Selector for Recurring Buyers */}
            {!isGuest && (
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
                <span className="text-neutral-400 font-bold block text-[11px]">Direcciones Guardadas:</span>
                <div className="space-y-1 font-mono">
                  <label className="flex items-center gap-2 text-neutral-200 cursor-pointer">
                    <input
                      type="radio"
                      name="address_option"
                      checked={useSavedAddress}
                      onChange={() => setUseSavedAddress(true)}
                      className="accent-red-600"
                    />
                    <span>Usar dirección predeterminada ({formData.address})</span>
                  </label>
                  <label className="flex items-center gap-2 text-neutral-200 cursor-pointer">
                    <input
                      type="radio"
                      name="address_option"
                      checked={!useSavedAddress}
                      onChange={() => setUseSavedAddress(false)}
                      className="accent-red-600"
                    />
                    <span>Ingresar nueva información de envío</span>
                  </label>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-300">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-300">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-sans"
                />
              </div>
            </div>

            {(hasPhysical || !useSavedAddress) && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  Dirección de Envío & Facturación
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Dirección de residencia"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-sans"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Ciudad"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-sans"
                    />
                    <input
                      type="text"
                      required
                      placeholder="País"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 font-sans"
                    />
                  </div>
                </div>
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
                Simulación de pago sin cobro real.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isGuest}
            className="w-full py-4 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-600 active:scale-[0.99] border border-red-500/40 shadow-xl shadow-red-950 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Procesando pago seguro…</span>
              </>
            ) : isGuest ? (
              <span>Inicia sesión para pagar</span>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-white" />
                <span>Pagar {formatPrice(totalCents)} y Desbloquear</span>
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
              <div key={item.id} className="flex items-center gap-3 bg-neutral-900/40 p-2.5 rounded-xl border border-neutral-800/60">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-950 shrink-0">
                  {item.product.thumbnail_url && (
                    <Image src={item.product.thumbnail_url} alt={item.product.name} fill className="object-cover" />
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
