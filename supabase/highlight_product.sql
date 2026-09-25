alter table public.posts
  add column if not exists highlight_tag text default 'Lanzamiento',
  add column if not exists linked_product_id uuid references public.products (id) on delete set null,
  add column if not exists status text default 'visible' check (status in ('visible', 'hidden', 'archived'));
