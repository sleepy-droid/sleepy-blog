import { createClient } from '@/utils/supabase/server'
import type { Product } from '@/lib/types'

export async function getUserLibraryProducts(userId: string): Promise<Product[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('library_items')
    .select('product_id, products (*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data
    .map((row) => {
      const p = row.products
      return (Array.isArray(p) ? p[0] : p) as Product | null
    })
    .filter((p): p is Product => Boolean(p))
}

export async function userOwnsProduct(userId: string, productId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('library_items')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()
  return Boolean(data)
}

export async function getActiveMembership(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data || data.plan === 'none') return null
  if (data.active_until && new Date(data.active_until) < new Date()) return null
  return data
}
