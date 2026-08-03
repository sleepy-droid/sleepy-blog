import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refresca la sesión de Supabase en cada request (cookies SSR).
 * Solo protege rutas /admin/* a nivel grueso (hay sesión o no).
 * La verificación de rol admin se hace en app/admin/layout.tsx.
 *
 * IMPORTANTE: no redirigir el sitio público entero al login.
 * La bitácora, shop y community deben ser accesibles sin cuenta.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // No ejecutes código entre createServerClient y getClaims().
  // Si lo haces, la sesión puede desincronizarse y cerrar al usuario al azar.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  const pathname = request.nextUrl.pathname
  const isAdminRoute = pathname.startsWith('/admin')
  const isAuthRoute = pathname.startsWith('/auth')

  // Solo /admin exige sesión. El resto del sitio es público.
  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Si ya hay sesión y entra a login/register, mándalo al inicio
  if (user && (pathname === '/auth/login' || pathname === '/auth/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Evitar warning de variable no usada si isAuthRoute se usa en el futuro
  void isAuthRoute

  return supabaseResponse
}
