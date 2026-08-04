-- PasoCRM — esquema inicial: clientes y seguimientos (pipeline)
-- Ejecutar en Supabase SQL Editor, o vía `supabase db push` si usas el CLI.

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null,
  telefono_whatsapp text,
  email text,
  origen text not null default 'walk-in' check (origen in ('walk-in', 'referido', 'otro')),
  referido_por_id uuid references public.clientes (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.clientes is 'Prospectos y clientes de Dormiluna.';

-- Cada fila es un evento de seguimiento (log). La etapa "actual" de un
-- cliente es la del seguimiento más reciente — ver vista clientes_con_etapa.
create table if not exists public.seguimientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  etapa text not null check (
    etapa in ('prospecto', 'cotizo', 'compro', 'posventa', 'referido_solicitado')
  ),
  proxima_accion text,
  proxima_accion_fecha date,
  notas text,
  created_at timestamptz not null default now()
);

comment on table public.seguimientos is 'Historial de seguimiento por cliente; la fila más reciente define la etapa actual.';

create index if not exists clientes_user_id_idx on public.clientes (user_id);
create index if not exists seguimientos_user_id_idx on public.seguimientos (user_id);
create index if not exists seguimientos_cliente_id_created_at_idx on public.seguimientos (cliente_id, created_at desc);

alter table public.clientes enable row level security;
alter table public.seguimientos enable row level security;

create policy "clientes_select_own" on public.clientes for select using (auth.uid () = user_id);

create policy "clientes_insert_own" on public.clientes for insert
with
  check (auth.uid () = user_id);

create policy "clientes_update_own" on public.clientes
for update
  using (auth.uid () = user_id);

create policy "clientes_delete_own" on public.clientes for delete using (auth.uid () = user_id);

create policy "seguimientos_select_own" on public.seguimientos for select using (auth.uid () = user_id);

create policy "seguimientos_insert_own" on public.seguimientos for insert
with
  check (auth.uid () = user_id);

create policy "seguimientos_update_own" on public.seguimientos
for update
  using (auth.uid () = user_id);

create policy "seguimientos_delete_own" on public.seguimientos for delete using (auth.uid () = user_id);

-- Vista de conveniencia: un cliente + su etapa/próxima acción más reciente.
-- security_invoker es obligatorio: sin esto la vista corre con los permisos
-- del dueño (postgres) y se salta RLS, filtrando datos entre usuarios.
create or replace view public.clientes_con_etapa
with
  (security_invoker = true) as
select distinct
  on (c.id) c.id,
  c.user_id,
  c.nombre,
  c.telefono_whatsapp,
  c.email,
  c.origen,
  c.referido_por_id,
  c.created_at,
  s.id as ultimo_seguimiento_id,
  s.etapa,
  s.proxima_accion,
  s.proxima_accion_fecha,
  s.notas as ultima_nota,
  s.created_at as etapa_actualizada_at
from
  public.clientes c
  left join public.seguimientos s on s.cliente_id = c.id
order by c.id, s.created_at desc nulls last;
