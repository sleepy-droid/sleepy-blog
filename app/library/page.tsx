/**
 * User Library Page: /library
 * File Path: app/library/page.tsx
 *
 * Features (v1.0):
 * 1. Web Player on top for playing owned songs directly in browser.
 * 2. Entitlement-verified downloads (/api/media/download) for WAV, MP3, Acapella & Instrumental.
 * 3. Real database queries for user's library_items and physical orders (no fake placeholders).
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { LibraryClient, type PhysicalOrderType } from './LibraryClient'
import { Library, ShieldCheck } from 'lucide-react'
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

  // Si es el Administrador y aún no se ha auto-comprado ítems, permitir previsualizar su propio catálogo real publicado
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

  // 2. Fetch real physical orders from `orders` and `order_items`
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
      <header className="border-b border-neutral-800/80 pb-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 border border-red-900/40 text-red-400">
          <Library className="w-3.5 h-3.5" />
          <span>Biblioteca Personal de Usuario</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Mis Adquisiciones & Música
        </h1>
        <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
          Accede a todos tus archivos de audio máster WAV/MP3, pistas vocales acapella, instrumentales y registros de compras oficiales.
        </p>
      </header>

      {/* Interactive Web Player Top Bar and Downloads List */}
      <LibraryClient digitalItems={digitalItems} physicalOrders={physicalOrders} />

      {/* Assurance Footer */}
      <footer className="p-4 rounded-2xl border border-neutral-800/60 bg-neutral-900/20 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-red-500" />
        <span>Descargas autenticadas de alta calidad servidas desde la bóveda oficial de sleepyred999.</span>
      </footer>
    </main>
  )
}
