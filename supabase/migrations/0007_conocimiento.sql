-- PasoCRM — base de conocimiento estructurada en 8 secciones fijas, con
-- embeddings de Voyage AI para búsqueda semántica (RAG). Reemplaza a
-- info_negocio como fuente de contexto de los chats de IA; info_negocio se
-- deja sin usar (no se borra, es dato real de Edwin).

create extension if not exists vector;

create table if not exists public.conocimiento_negocio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  seccion text not null check (
    seccion in (
      'catalogo',
      'objeciones',
      'preguntas_frecuentes',
      'garantias',
      'tono',
      'proceso_venta',
      'promociones',
      'datos_empresa'
    )
  ),
  contenido text not null default '',
  -- voyage-3-lite: 512 dimensiones, barato, cuota gratis generosa, de sobra
  -- para 8 secciones cortas por usuario.
  embedding vector (512),
  updated_at timestamptz not null default now(),
  unique (user_id, seccion)
);

comment on table public.conocimiento_negocio is 'Base de conocimiento del negocio (Dormiluna) en 8 secciones fijas por usuario, con embedding para búsqueda semántica. Reemplaza a info_negocio.';

create index if not exists conocimiento_negocio_user_id_idx on public.conocimiento_negocio (user_id);

-- Sin índice ivfflat/hnsw: con ~8 filas por usuario, un escaneo secuencial
-- con el operador <=> es instantáneo. Un índice ANN solo se justifica con
-- miles de filas y además sacrifica exactitud (es aproximado) — no vale la
-- pena a este volumen.

alter table public.conocimiento_negocio enable row level security;

create policy "conocimiento_negocio_select_own" on public.conocimiento_negocio for select using (auth.uid () = user_id);

create policy "conocimiento_negocio_insert_own" on public.conocimiento_negocio for insert
with
  check (auth.uid () = user_id);

create policy "conocimiento_negocio_update_own" on public.conocimiento_negocio
for update
  using (auth.uid () = user_id);

create policy "conocimiento_negocio_delete_own" on public.conocimiento_negocio for delete using (auth.uid () = user_id);

-- Búsqueda semántica. security invoker (NO definer): RLS sigue aplicando
-- con el auth.uid() de quien llama vía supabase.rpc() desde el server
-- action normal — nunca se salta el filtro por usuario. Sin cutoff de
-- similarity mínima: con solo 8 filas candidatas es barato devolver
-- siempre el top-k, y el prompt ya instruye a Claude a no inventar con
-- datos irrelevantes.
create or replace function public.buscar_conocimiento (query_embedding vector (512), match_count int default 4)
returns table (seccion text, contenido text, similarity float)
language sql
stable
security invoker
set search_path = public
as $$
  select
    seccion,
    contenido,
    1 - (embedding <=> query_embedding) as similarity
  from public.conocimiento_negocio
  where user_id = auth.uid()
    and embedding is not null
    and contenido <> ''
  order by embedding <=> query_embedding
  limit match_count;
$$;
