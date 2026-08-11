import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { EditProductForm } from './EditProductForm'
import type { Product } from '@/lib/types'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Editar Producto | Panel Admin sleepyred999',
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  await requireAdmin()
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product) {
    notFound()
  }

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
      <nav>
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Volver a Catálogo
        </Link>
      </nav>

      <div className="border border-neutral-800/90 rounded-3xl p-6 sm:p-8 bg-neutral-950 space-y-6 shadow-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-red-500" />
            Editar Producto del Catálogo
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Modifica precios, descripción o archivos asociados a este producto.
          </p>
        </div>

        <EditProductForm product={product as Product} />
      </div>
    </main>
  )
}
