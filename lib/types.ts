/** Roles posibles en public.profiles */
export type UserRole = 'user' | 'admin'

export type ModerationStatus = 'visible' | 'hidden' | 'deleted'

export type ProductFulfillment = 'digital' | 'physical'
export type ProductCategory = 'music' | 'merch' | 'poster' | 'bundle' | 'other'

/** Fila de public.profiles */
export type Profile = {
  id: string
  email: string | null
  display_name: string | null
  username: string | null
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  favorite_product_id: string | null
  is_public: boolean
  role: UserRole
  created_at: string
  updated_at: string
}

/** Fila de public.posts */
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
  is_featured?: boolean
  is_published?: boolean
  view_count?: number
  like_count?: number
  upvotes?: number
  downvotes?: number
  status?: string
}

export type Product = {
  id: string
  slug: string
  name: string
  description: string
  fulfillment: ProductFulfillment
  category: ProductCategory
  thumbnail_url: string | null
  gallery: unknown
  price_cents: number
  currency: string
  stock: number | null
  is_published: boolean
  is_featured: boolean
  audio_preview_url: string | null
  video_url?: string | null
  acapella_url?: string | null
  instrumental_url?: string | null
  wav_url?: string | null
  mp3_url?: string | null
  duration_seconds: number | null
  specs: Record<string, string> | null
  popularity_score: number
  upvotes?: number
  downvotes?: number
  created_at: string
  updated_at: string
}

export type ProductVariant = {
  id: string
  product_id: string
  sku: string | null
  label: string
  price_cents: number | null
  stock: number | null
  extra: Record<string, unknown> | null
}

export type LibraryItem = {
  id: string
  user_id: string
  product_id: string
  source: 'purchase' | 'admin_grant' | 'membership' | 'gift'
  created_at: string
}

export type CartItem = {
  id: string
  user_id: string
  product_id: string
  variant_label?: string | null
  quantity: number
  product?: Product
  created_at?: string
}

export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'

export type Order = {
  id: string
  user_id: string
  status: OrderStatus
  total_cents: number
  currency: string
  shipping_address?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  variant_label?: string | null
  quantity: number
  unit_price_cents: number
  product?: Product
  created_at?: string
}

export type VoteTargetType = 'post' | 'product' | 'forum_thread' | 'comment'

export type Vote = {
  id: string
  user_id: string
  target_type: VoteTargetType
  target_id: string
  vote_value: 1 | -1
  created_at: string
}

export type CommentTargetType = 'post' | 'product' | 'forum_thread' | 'profile_update'

/** Fila de public.comments */
export type Comment = {
  id: string
  post_id?: string | null
  target_type?: CommentTargetType | null
  target_id?: string | null
  user_id: string
  body: string
  status?: ModerationStatus
  hidden_at?: string | null
  hidden_by?: string | null
  upvotes?: number
  downvotes?: number
  created_at: string
  updated_at: string
}

/** Comentario con datos del autor */
export type CommentWithAuthor = Comment & {
  profiles: Pick<Profile, 'display_name' | 'email' | 'avatar_url' | 'username'> | null
}

/** Sesión de app */
export type AppUser = {
  id: string
  email: string | null
  profile: Profile | null
  isAdmin: boolean
}

export type SiteSettingsMap = Record<string, string>

export function formatPrice(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100)
}
