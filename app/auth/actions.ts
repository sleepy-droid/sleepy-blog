'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export type AuthActionState = {
  error?: string
  success?: string
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Iniciar sesión con email + contraseña.
 * Server Action: corre solo en el servidor (seguro para credenciales).
 */
export async function login(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const next = String(formData.get('next') ?? '/') || '/'

  if (!email || !password) {
    return { error: 'Completa email y contraseña.' }
  }
  if (!isValidEmail(email)) {
    return { error: 'El email no es válido.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Mensajes genéricos: no revelar si el email existe
    return { error: 'Credenciales incorrectas. Revisa tu email o contraseña.' }
  }

  revalidatePath('/', 'layout')
  redirect(next.startsWith('/') ? next : '/')
}

/**
 * Registrar nueva cuenta.
 * Supabase Auth crea el usuario; el trigger handle_new_user crea el profile.
 */
export async function register(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const displayName = String(formData.get('display_name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm_password') ?? '')

  if (displayName.length < 2 || displayName.length > 40) {
    return { error: 'El nombre debe tener entre 2 y 40 caracteres.' }
  }
  if (!email || !isValidEmail(email)) {
    return { error: 'Ingresa un email válido.' }
  }
  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  }
  if (password !== confirm) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return { error: 'Este email ya está registrado. Prueba iniciar sesión.' }
    }
    return { error: error.message || 'No se pudo crear la cuenta.' }
  }

  // Si el proyecto exige confirmación de email, no hay sesión aún
  if (!data.session) {
    return {
      success:
        'Cuenta creada. Revisa tu correo para confirmar la cuenta antes de iniciar sesión.',
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * Cerrar sesión y limpiar cookies de Auth.
 */
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
