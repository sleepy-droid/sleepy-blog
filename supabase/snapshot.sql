-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  media_url text,
  price numeric,
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  is_published boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0,
  status text DEFAULT 'published'::text,
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  image_url text,
  cover_url text,
  highlight_tag text DEFAULT 'Lanzamiento'::text,
  linked_product_id uuid,
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_linked_product_id_fkey FOREIGN KEY (linked_product_id) REFERENCES public.products(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  display_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  username text,
  bio text,
  banner_url text,
  favorite_product_id uuid,
  is_public boolean NOT NULL DEFAULT true,
  birthday date,
  gender text DEFAULT 'unspecified'::text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'gender_neutral'::text, 'unspecified'::text])),
  status_update text,
  can_comment boolean NOT NULL DEFAULT true,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_favorite_product_id_fkey FOREIGN KEY (favorite_product_id) REFERENCES public.products(id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid,
  user_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(TRIM(BOTH FROM body)) >= 1 AND char_length(TRIM(BOTH FROM body)) <= 2000),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  target_type text DEFAULT 'post'::text CHECK (target_type = ANY (ARRAY['post'::text, 'product'::text, 'forum_thread'::text, 'profile_update'::text])),
  target_id uuid,
  status text DEFAULT 'visible'::text CHECK (status = ANY (ARRAY['visible'::text, 'hidden'::text, 'deleted'::text])),
  hidden_at timestamp with time zone,
  hidden_by uuid,
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT comments_hidden_by_fkey FOREIGN KEY (hidden_by) REFERENCES auth.users(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  fulfillment text NOT NULL CHECK (fulfillment = ANY (ARRAY['digital'::text, 'physical'::text])),
  category text NOT NULL CHECK (category = ANY (ARRAY['music'::text, 'merch'::text, 'poster'::text, 'bundle'::text, 'other'::text])),
  thumbnail_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'USD'::text,
  stock integer,
  is_published boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  audio_preview_url text,
  duration_seconds integer,
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  popularity_score integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  video_url text,
  acapella_url text,
  instrumental_url text,
  wav_url text,
  mp3_url text,
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  storage_folder_path text,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  sku text,
  label text NOT NULL,
  price_cents integer,
  stock integer,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.product_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind = ANY (ARRAY['mp3'::text, 'wav'::text, 'pdf'::text, 'image'::text, 'other'::text])),
  storage_path text NOT NULL,
  label text,
  requires_membership boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_assets_pkey PRIMARY KEY (id),
  CONSTRAINT product_assets_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.library_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'admin_grant'::text CHECK (source = ANY (ARRAY['purchase'::text, 'admin_grant'::text, 'membership'::text, 'gift'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT library_items_pkey PRIMARY KEY (id),
  CONSTRAINT library_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT library_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.memberships (
  user_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'none'::text CHECK (plan = ANY (ARRAY['none'::text, 'monthly'::text, 'yearly'::text])),
  active_until timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT memberships_pkey PRIMARY KEY (user_id),
  CONSTRAINT memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.forum_threads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT ''::text,
  image_url text,
  linked_product_id uuid,
  youtube_url text,
  status text NOT NULL DEFAULT 'visible'::text CHECK (status = ANY (ARRAY['visible'::text, 'hidden'::text, 'deleted'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tags ARRAY NOT NULL DEFAULT '{}'::text[],
  upvotes integer NOT NULL DEFAULT 0,
  downvotes integer NOT NULL DEFAULT 0,
  product_ids ARRAY NOT NULL DEFAULT '{}'::text[],
  CONSTRAINT forum_threads_pkey PRIMARY KEY (id),
  CONSTRAINT forum_threads_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id),
  CONSTRAINT forum_threads_linked_product_id_fkey FOREIGN KEY (linked_product_id) REFERENCES public.products(id)
);
CREATE TABLE public.forum_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  author_id uuid NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'visible'::text CHECK (status = ANY (ARRAY['visible'::text, 'hidden'::text, 'deleted'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT forum_replies_pkey PRIMARY KEY (id),
  CONSTRAINT forum_replies_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.forum_threads(id),
  CONSTRAINT forum_replies_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profile_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  body text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'visible'::text CHECK (status = ANY (ARRAY['visible'::text, 'hidden'::text, 'deleted'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profile_updates_pkey PRIMARY KEY (id),
  CONSTRAINT profile_updates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.site_settings (
  key text NOT NULL,
  value text NOT NULL DEFAULT ''::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'processing'::text CHECK (status = ANY (ARRAY['processing'::text, 'shipped'::text, 'delivered'::text, 'completed'::text, 'cancelled'::text])),
  total_cents integer NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  currency text NOT NULL DEFAULT 'USD'::text,
  shipping_address text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  billing_info text,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  variant_label text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents integer NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  variant_label text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['post'::text, 'product'::text, 'forum_thread'::text, 'comment'::text])),
  target_id uuid NOT NULL,
  vote_value integer NOT NULL CHECK (vote_value = ANY (ARRAY[1, '-1'::integer])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT votes_pkey PRIMARY KEY (id),
  CONSTRAINT votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  target_type text,
  target_id text,
  user_id uuid,
  billing_period text NOT NULL DEFAULT to_char((now() AT TIME ZONE 'UTC'::text), 'YYYY-MM'::text),
  country text DEFAULT 'PA'::text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.analytics_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  billing_period text NOT NULL UNIQUE,
  tier text NOT NULL DEFAULT 'monthly_permanent'::text CHECK (tier = ANY (ARRAY['monthly_permanent'::text, 'all_time_premium'::text])),
  is_active boolean NOT NULL DEFAULT true,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  CONSTRAINT analytics_subscriptions_pkey PRIMARY KEY (id)
);