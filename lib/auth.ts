import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { AppUser, Profile } from '@/lib/types'

/**
 * Obtiene el usuario de Auth actual (servidor).
 * Usa getUser() — valida el JWT contra Supabase (más seguro que solo confiar en la cookie).
 */
export async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}

/**
 * Carga el perfil de public.profiles para un user id.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null
  return data as Profile
}

/**
 * Usuario de la app: Auth + profile + flag isAdmin.
 * Devuelve null si no hay sesión.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const user = await getAuthUser()
  if (!user) return null

  const profile = await getProfile(user.id)

  return {
    id: user.id,
    email: user.email ?? profile?.email ?? null,
    profile,
    isAdmin: profile?.role === 'admin',
  }
}

/**
 * Exige sesión. Si no hay, redirige a login.
 */
export async function requireUser(nextPath?: string): Promise<AppUser> {
  const current = await getCurrentUser()
  if (!current) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''
    redirect(`/auth/login${next}`)
  }
  return current
}

/**
 * Exige rol admin. Si no hay sesión → login. Si hay pero no es admin → inicio.
 */
export async function requireAdmin(): Promise<AppUser> {
  const current = await requireUser('/admin')
  if (!current.isAdmin) {
    redirect('/')
  }
  return current
}
