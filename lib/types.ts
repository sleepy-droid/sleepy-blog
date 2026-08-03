/** Roles posibles en public.profiles */
export type UserRole = 'user' | 'admin'

/** Fila de public.profiles */
export type Profile = {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

/** Fila de public.posts (campos usados en la app) */
export type Post = {
  id: string
  title: string
  content: string
  category: string | null
  created_at: string
  image_url?: string | null
  cover_url?: string | null
  media_url?: string | null
  price?: number | null
}

/** Fila de public.comments */
export type Comment = {
  id: string
  post_id: string
  user_id: string
  body: string
  created_at: string
  updated_at: string
}

/** Comentario con datos del autor (join profiles) */
export type CommentWithAuthor = Comment & {
  profiles: Pick<Profile, 'display_name' | 'email' | 'avatar_url'> | null
}

/** Sesión de app: usuario Auth + perfil */
export type AppUser = {
  id: string
  email: string | null
  profile: Profile | null
  isAdmin: boolean
}
