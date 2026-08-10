'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ShieldCheck, CreditCard, CheckCircle2, ArrowLeft, Lock, Sparkles, Loader2 } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/types'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalCents, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const [formData, setFormData] = useState({
    name: 'Sleepy Member',
    email: 'fan@example.com',
    address: 'Calle 123 # 45 - 67',
    city: 'Bogotá',
    country: 'Colombia',
  })

  const hasPhysical = items.some((item) => item.product.fulfillment === 'physical')

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate order placement
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
          <h1 className="text-3xl font-extrabold text-white">¡Pago Confirmado y Orden Recibida!</h1>
          <p className="text-sm text-neutral-300 max-w-md mx-auto">
            Tu compra ha sido procesada con éxito. Los lanzamientos musicales ya están disponibles en tu biblioteca personal para escuchar o descargar offline.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/library"
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-all shadow-lg"
          >
            Ir a mi Biblioteca
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
            Finalizar Compra Seguro
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Ingresa tus datos para completar la orden y desbloquear tus descargas.
          </p>
        </div>

        <Link href="/cart" className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Volver al Carrito
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Checkout Form */}
        <form onSubmit={handlePay} className="lg:col-span-7 space-y-6">
          <div className="border border-neutral-800/80 bg-neutral-900/40 p-6 rounded-2xl space-y-4 backdrop-blur-md">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Sparkles className="w-4 h-4 text-red-500" />
              Datos del Cliente
            </h2>

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

            {hasPhysical && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Dirección de Envío (Para prendas / mercancía física)
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
                Simulación de transacción segura sin cobro real.
              </p>
            </div>
          </div>

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
