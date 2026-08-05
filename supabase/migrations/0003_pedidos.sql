-- PasoCRM — módulo de pedidos con foto (Supabase Storage)

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  cotizacion_id uuid references public.cotizaciones (id) on delete set null,
  -- Guarda la ruta dentro del bucket "pedidos" (no una URL pública — el
  -- bucket es privado). La app genera un signed URL al mostrarla.
  foto_url text not null,
  monto numeric(12, 2) not null,
  fecha_compra date not null default current_date,
  created_at timestamptz not null default now()
);

comment on table public.pedidos is 'Ventas confirmadas con foto del pedido; dispara el seguimiento posventa.';

create index if not exists pedidos_user_id_idx on public.pedidos (user_id);
create index if not exists pedidos_cliente_id_idx on public.pedidos (cliente_id);

alter table public.pedidos enable row level security;

create policy "pedidos_select_own" on public.pedidos for select using (auth.uid () = user_id);

create policy "pedidos_insert_own" on public.pedidos for insert
with
  check (auth.uid () = user_id);

create policy "pedidos_update_own" on public.pedidos
for update
  using (auth.uid () = user_id);

create policy "pedidos_delete_own" on public.pedidos for delete using (auth.uid () = user_id);

-- Bucket privado para las fotos. Cada usuario solo puede leer/escribir
-- dentro de una carpeta con su propio auth.uid() como nombre
-- (ej. "3f2a.../foto123.jpg") — mismo patrón de aislamiento que las
-- policies de las tablas, aplicado a storage.objects.
insert into
  storage.buckets (id, name, public)
values
  ('pedidos', 'pedidos', false)
on conflict (id) do nothing;

create policy "pedidos_storage_select_own" on storage.objects for select using (
  bucket_id = 'pedidos'
  and (storage.foldername (name)) [1] = auth.uid ()::text
);

create policy "pedidos_storage_insert_own" on storage.objects for insert
with
  check (
    bucket_id = 'pedidos'
    and (storage.foldername (name)) [1] = auth.uid ()::text
  );

create policy "pedidos_storage_delete_own" on storage.objects for delete using (
  bucket_id = 'pedidos'
  and (storage.foldername (name)) [1] = auth.uid ()::text
);
