-- PasoCRM — módulo de cotizaciones con link público

create table if not exists public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  productos jsonb not null default '[]'::jsonb,
  monto_total numeric(12, 2) not null default 0,
  token_publico uuid not null default gen_random_uuid(),
  estado text not null default 'enviada' check (
    estado in ('enviada', 'vista', 'aceptada', 'vencida')
  ),
  vista_en timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.cotizaciones is 'Cotizaciones con link público consultable por el cliente (token_publico).';

create unique index if not exists cotizaciones_token_publico_idx on public.cotizaciones (token_publico);
create index if not exists cotizaciones_user_id_idx on public.cotizaciones (user_id);
create index if not exists cotizaciones_cliente_id_idx on public.cotizaciones (cliente_id);

alter table public.cotizaciones enable row level security;

-- Solo el dueño (Edwin) ve/gestiona sus cotizaciones desde la app. La página
-- pública /cotizacion/[token] NO pasa por aquí: usa el cliente de
-- service_role en el servidor (ver lib/supabase/service.ts), así que no
-- necesita ni debe existir una policy de SELECT para el rol anon — evita
-- que cualquiera pueda listar todas las cotizaciones sin conocer un token.
create policy "cotizaciones_select_own" on public.cotizaciones for select using (auth.uid () = user_id);

create policy "cotizaciones_insert_own" on public.cotizaciones for insert
with
  check (auth.uid () = user_id);

create policy "cotizaciones_update_own" on public.cotizaciones
for update
  using (auth.uid () = user_id);

create policy "cotizaciones_delete_own" on public.cotizaciones for delete using (auth.uid () = user_id);

-- Necesario para que Realtime (postgres_changes) transmita cambios de esta
-- tabla — sin esto, la suscripción del dashboard nunca recibe eventos.
alter publication supabase_realtime add table public.cotizaciones;
