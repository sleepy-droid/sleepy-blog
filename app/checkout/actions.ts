'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export type CheckoutItemInput = {
  productId: string
  variantLabel: string
  quantity: number
  unitPriceCents: number
  fulfillment: 'digital' | 'physical'
}

export type PlaceOrderInput = {
  customerName: string
  customerEmail: string
  shippingAddress: string
  city: string
  country: string
  totalCents: number
  items: CheckoutItemInput[]
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function placeOrderAction(input: PlaceOrderInput): Promise<{
  error?: string
  orderId?: string
}> {
  const user = await getCurrentUser()
  if (!user) {
    return {
      error: 'Debes iniciar sesión para procesar tu pedido y guardar el recibo en tu cuenta.',
    }
  }

  if (!input.items || input.items.length === 0) {
    return { error: 'Tu carrito está vacío.' }
  }

  const supabase = await createClient()
  const fullShippingAddress = `${input.shippingAddress}, ${input.city}, ${input.country}`.trim()
  const billingInfo = `${input.customerName} (${input.customerEmail})`

  // 1. Crear el recibo maestro en `public.orders`
  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'processing',
      total_cents: input.totalCents,
      currency: 'USD',
      shipping_address: fullShippingAddress,
      billing_info: billingInfo,
      notes: `Recibo con ${input.items.length} ítem(s)`,
    })
    .select('id')
    .single()

  if (orderError || !orderRow) {
    return {
      error: orderError?.message || 'No se pudo generar el recibo de la orden.',
    }
  }

  const orderId = orderRow.id

  // 2. Resolver UUIDs de productos si alguno viene por slug y registrar todos los ítems en `public.order_items`
  for (const item of input.items) {
    let resolvedProductId = item.productId

    if (!UUID_REGEX.test(resolvedProductId)) {
      const { data: prodBySlug } = await supabase
        .from('products')
        .select('id')
        .eq('slug', resolvedProductId)
        .maybeSingle()

      if (prodBySlug?.id) {
        resolvedProductId = prodBySlug.id
      }
    }

    if (UUID_REGEX.test(resolvedProductId)) {
      await supabase.from('order_items').insert({
        order_id: orderId,
        product_id: resolvedProductId,
        variant_label: item.variantLabel || 'Estándar',
        quantity: item.quantity || 1,
        unit_price_cents: item.unitPriceCents || 0,
      })

      // 3. Si es un producto digital (o para el registro de trofeos en library_items), desbloquear en `public.library_items`
      const { data: existingLib } = await supabase
        .from('library_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', resolvedProductId)
        .maybeSingle()

      if (!existingLib) {
        await supabase.from('library_items').insert({
          user_id: user.id,
          product_id: resolvedProductId,
          source: 'purchase',
        })
      }
    }
  }

  revalidatePath('/orders')
  revalidatePath('/library')
  revalidatePath('/player')
  revalidatePath('/profile')

  return { orderId }
}

/**
 * Permite al Administrador actualizar el estado de envío físico de un recibo (`processing` -> `shipped` -> `delivered`).
 */
export async function updateOrderStatusAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !user.isAdmin) {
    return { error: 'Solo el administrador puede actualizar el estado de envío.' }
  }

  const orderId = String(formData.get('order_id') ?? '').trim()
  const status = String(formData.get('status') ?? 'processing').trim()

  if (!orderId) return { error: 'ID de orden requerido.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/orders')
  revalidatePath('/library')
  revalidatePath('/admin')
  return { success: true }
}
