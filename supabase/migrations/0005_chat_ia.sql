-- PasoCRM — chat con IA (ficha de cliente + chat general del negocio) y
-- el bloque de texto editable que alimenta las preguntas de catálogo.

create table if not exists public.chat_agente (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cliente_id uuid references public.clientes (id) on delete cascade,
  rol text not null check (rol in ('user', 'assistant')),
  mensaje text not null,
  created_at timestamptz not null default now()
);

comment on table public.chat_agente is 'Historial de los dos chats de IA: cliente_id null = chat general del negocio (Inicio), cliente_id con valor = chat de esa ficha.';

create index if not exists chat_agente_user_id_idx on public.chat_agente (user_id);
create index if not exists chat_agente_cliente_id_created_at_idx on public.chat_agente (cliente_id, created_at);

alter table public.chat_agente enable row level security;

create policy "chat_agente_select_own" on public.chat_agente for select using (auth.uid () = user_id);

create policy "chat_agente_insert_own" on public.chat_agente for insert
with
  check (auth.uid () = user_id);

create policy "chat_agente_update_own" on public.chat_agente
for update
  using (auth.uid () = user_id);

create policy "chat_agente_delete_own" on public.chat_agente for delete using (auth.uid () = user_id);

-- Una fila por usuario con el catalogo/garantias/objeciones en texto libre,
-- que se inyecta tal cual en el system prompt de los dos chats.
create table if not exists public.info_negocio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade unique,
  contenido text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.info_negocio enable row level security;

create policy "info_negocio_select_own" on public.info_negocio for select using (auth.uid () = user_id);

create policy "info_negocio_insert_own" on public.info_negocio for insert
with
  check (auth.uid () = user_id);

create policy "info_negocio_update_own" on public.info_negocio
for update
  using (auth.uid () = user_id);

create policy "info_negocio_delete_own" on public.info_negocio for delete using (auth.uid () = user_id);
