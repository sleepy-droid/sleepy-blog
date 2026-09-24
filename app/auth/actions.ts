'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
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
  const identifier = String(
    formData.get('identifier') ?? formData.get('email') ?? ''
  ).trim()
  const password = String(formData.get('password') ?? '')
  const next = String(formData.get('next') ?? '/') || '/'

  if (!identifier || !password) {
    return { error: 'Ingresa tu email o usuario y tu contraseña.' }
  }

  const supabase = await createClient()
  let email = identifier.toLowerCase()

  if (!isValidEmail(email)) {
    // Si no es un formato de email, buscamos por username en public.profiles
    const cleanUsername = identifier.startsWith('@') ? identifier.slice(1) : identifier

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .ilike('username', cleanUsername)
      .maybeSingle()

    if (!profile?.email) {
      // Búsqueda alternativa por display_name
      const { data: byDisplayName } = await supabase
        .from('profiles')
        .select('email')
        .ilike('display_name', cleanUsername)
        .maybeSingle()

      if (!byDisplayName?.email) {
        return {
          error: 'No encontramos ninguna cuenta asociada a este usuario o email.',
        }
      }
      email = byDisplayName.email.toLowerCase()
    } else {
      email = profile.email.toLowerCase()
    }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Mensajes genéricos: no revelar si el email existe
    return { error: 'Credenciales incorrectas. Revisa tu usuario o contraseña.' }
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
 * Solicitar correo de recuperación de contraseña con Supabase Auth.
 */
export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!email || !isValidEmail(email)) {
    return { error: 'Ingresa un correo electrónico válido.' }
  }

  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') || headerList.get('host')
  const proto =
    headerList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
  const origin = host
    ? `${proto}://${host}`
    : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  })

  if (error) {
    return {
      error:
        error.message ||
        'No se pudo enviar el correo de recuperación. Inténtalo de nuevo más tarde.',
    }
  }

  return {
    success:
      '¡Enlace enviado! Hemos remitido las instrucciones a tu correo electrónico. Por favor revisa tu bandeja de entrada o spam.',
  }
}

/**
 * Actualizar contraseña una vez autenticado mediante el token de recuperación.
 */
export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirm_password') ?? '')

  if (!password || password.length < 8) {
    return { error: 'La nueva contraseña debe tener al menos 8 caracteres.' }
  }
  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return {
      error:
        error.message ||
        'No se pudo actualizar la contraseña. El enlace de recuperación puede haber caducado.',
    }
  }

  revalidatePath('/', 'layout')
  redirect('/auth/login?updated=true')
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
