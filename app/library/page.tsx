/**
 * User Library Trophy Display: /library
 * File Path: app/library/page.tsx
 *
 * Features (v1.1):
 * 1. Collector's Trophy Display ("Vitrina de Trofeos & Colección") for all unlocked digital & physical items.
 * 2. Dedicated Digital Media Webplayer separated into `/player` (accessible with 1 click per track).
 * 3. Multi-item receipt & physical order tracking separated into `/orders` (accessible with 1 click).
 * 4. Entitlement-verified downloads (/api/media/download) for WAV, MP3, Acapella & Instrumental.
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { LibraryClient, type PhysicalOrderType } from './LibraryClient'
import { Award, ShieldCheck, Headphones, Package } from 'lucide-react'
import type { Product } from '@/lib/types'

export default async function LibraryPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect('/auth/login?next=/library')
  }

  const supabase = await createClient()

  // 1. Fetch real library items for the authenticated user
  const { data: libraryData } = await supabase
    .from('library_items')
    .select('id, user_id, product_id, source, created_at, products (*)')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })

  let digitalItems = (libraryData || [])
    .filter((item) => Boolean(item.products))
    .map((item) => {
      const prod = Array.isArray(item.products) ? item.products[0] : item.products
      return {
        id: item.id,
        user_id: item.user_id,
        product_id: item.product_id,
        source: (item.source || 'purchase') as 'purchase' | 'admin_grant' | 'membership' | 'gift',
        created_at: item.created_at,
        product: prod as Product,
      }
    })

  // Si es el Administrador y aún no se ha auto-comprado ítems, permitir visualizar su propio catálogo real publicado
  if (digitalItems.length === 0 && currentUser.isAdmin) {
    const { data: adminCatalog } = await supabase
      .from('products')
      .select('*')
      .eq('fulfillment', 'digital')
      .order('created_at', { ascending: false })

    if (adminCatalog && adminCatalog.length > 0) {
      digitalItems = adminCatalog.map((p) => ({
        id: `admin-cat-${p.id}`,
        user_id: currentUser.id,
        product_id: p.id,
        source: 'admin_grant' as const,
        created_at: p.created_at,
        product: p as Product,
      }))
    }
  }

  // 2. Fetch physical merch trophies from `orders` and `order_items`
  const { data: ordersData } = await supabase
    .from('orders')
    .select('id, status, created_at, order_items (id, variant_label, quantity, products (*))')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })

  const physicalOrders: PhysicalOrderType[] = []

  if (ordersData) {
    for (const ord of ordersData) {
      const items = Array.isArray(ord.order_items) ? ord.order_items : []
      for (const oi of items) {
        const prod = (Array.isArray(oi.products) ? oi.products[0] : oi.products) as Product | null
        if (prod && prod.fulfillment === 'physical') {
          const normalizedStatus: PhysicalOrderType['status'] =
            ord.status === 'shipped'
              ? 'shipped'
              : ord.status === 'delivered' || ord.status === 'completed'
              ? 'delivered'
              : 'processing'

          physicalOrders.push({
            id: `${ord.id}-${oi.id}`,
            orderId: ord.id,
            product: prod,
            variantLabel: oi.variant_label || 'Estándar',
            quantity: oi.quantity || 1,
            status: normalizedStatus,
            created_at: ord.created_at,
          })
        }
      }
    }
  }

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10 font-sans">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 border border-amber-700/40 text-amber-300">
            <Award className="w-3.5 h-3.5" />
            <span>Vitrina de Trofeos & Colección Personal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Mi Biblioteca & Trofeos
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
            Tu vitrina de lanzamientos desbloqueados y coleccionables oficiales. Escucha tus pistas en el Reproductor Web dedicado o rastrea tus recibos de envío en Mis Pedidos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/player"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 shadow-lg shadow-red-950/50 transition-all"
          >
            <Headphones className="w-4 h-4" />
            <span>Abrir Reproductor Web</span>
          </Link>

          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-200 bg-neutral-900 border border-neutral-800 hover:border-red-800 hover:text-white transition-all"
          >
            <Package className="w-4 h-4 text-red-400" />
            <span>Mis Pedidos & Recibos</span>
          </Link>
        </div>
      </header>

      <LibraryClient digitalItems={digitalItems} physicalOrders={physicalOrders} />

      {/* Assurance Footer */}
      <footer className="p-4 rounded-2xl border border-neutral-800/60 bg-neutral-900/20 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-red-500" />
        <span>Descargas autenticadas de alta calidad servidas desde la bóveda oficial de sleepyred999.</span>
      </footer>
    </main>
  )
}
