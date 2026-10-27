import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { Package, Award, Headphones, ShoppingBag, ShieldCheck } from 'lucide-react'
import { OrdersClient, type OrderReceipt, type OrderReceiptItem } from './OrdersClient'
import type { Product } from '@/lib/types'

export default async function OrdersPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect('/auth/login?next=/orders')
  }

  const supabase = await createClient()

  // 1. Consultar los recibos (orders) del usuario ordenados de más reciente a más antiguo
  const { data: rawOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })

  const orderIds = (rawOrders || []).map((o) => o.id)

  // 2. Consultar todos los order_items asociados a estos recibos
  const itemsByOrderId = new Map<string, OrderReceiptItem[]>()

  if (orderIds.length > 0) {
    const { data: rawOrderItems } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds)

    const productIds = Array.from(
      new Set((rawOrderItems || []).map((oi) => oi.product_id).filter(Boolean))
    )

    const productsMap = new Map<string, Product>()
    if (productIds.length > 0) {
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)

      for (const p of (prods || []) as Product[]) {
        productsMap.set(p.id, p)
      }
    }

    for (const oi of rawOrderItems || []) {
      const list = itemsByOrderId.get(oi.order_id) || []
      list.push({
        id: oi.id,
        order_id: oi.order_id,
        product_id: oi.product_id,
        variant_label: oi.variant_label || 'Estándar',
        quantity: oi.quantity || 1,
        unit_price_cents: oi.unit_price_cents || 0,
        product: productsMap.get(oi.product_id) || null,
      })
      itemsByOrderId.set(oi.order_id, list)
    }
  }

  const receipts: OrderReceipt[] = (rawOrders || []).map((o) => ({
    id: o.id,
    status: (o.status || 'processing') as OrderReceipt['status'],
    total_cents: o.total_cents || 0,
    currency: o.currency || 'USD',
    shipping_address: o.shipping_address || null,
    billing_info: o.billing_info || null,
    notes: o.notes || null,
    created_at: o.created_at,
    items: itemsByOrderId.get(o.id) || [],
  }))

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 border border-red-900/40 text-red-400">
            <Package className="w-3.5 h-3.5" />
            <span> Centro de Recibos & Seguimiento de Envíos</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Mis Pedidos & Recibos
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
            Revisa tus recibos consolidados con múltiples artículos, consulta el desglose de cada compra y sigue en tiempo real el estado de envío de tus prendas y productos físicos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/library"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/50 border border-amber-700/50 hover:bg-amber-900/50 transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Vitrina de Trofeos</span>
          </Link>
          <Link
            href="/player"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-200 bg-neutral-900 border border-neutral-800 hover:text-white hover:border-red-900/50 transition-colors"
          >
            <Headphones className="w-3.5 h-3.5 text-red-400" />
            <span>Reproductor Web</span>
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-colors shadow-md"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Tienda</span>
          </Link>
        </div>
      </header>

      <OrdersClient receipts={receipts} isAdmin={Boolean(currentUser.isAdmin)} />

      <footer className="p-4 rounded-2xl border border-neutral-800/60 bg-neutral-900/20 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-red-500" />
        <span>Cada recibo agrupa todos los artículos adquiridos en una misma orden de pago con trazabilidad completa.</span>
      </footer>
    </main>
  )
}
