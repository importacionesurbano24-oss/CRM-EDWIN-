-- PasoCRM — mensajes de WhatsApp (solo recepción por ahora, ver CLAUDE.md).
-- El webhook (app/api/whatsapp/webhook/route.ts) no tiene sesión de
-- usuario, así que inserta con el cliente de service role y user_id
-- explícito — por eso no hay "default auth.uid()" en user_id acá.

create table if not exists public.mensajes_whatsapp (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  direccion text not null check (direccion in ('entrante', 'saliente')),
  contenido text not null,
  generado_por_agente boolean not null default false,
  whatsapp_message_id text,
  created_at timestamptz not null default now()
);

comment on table public.mensajes_whatsapp is 'Historial de mensajes de WhatsApp por cliente. whatsapp_message_id evita duplicados si Meta reintenta la entrega del webhook.';

create index if not exists mensajes_whatsapp_user_id_idx on public.mensajes_whatsapp (user_id);
create index if not exists mensajes_whatsapp_cliente_id_created_at_idx on public.mensajes_whatsapp (cliente_id, created_at);
create unique index if not exists mensajes_whatsapp_whatsapp_message_id_idx on public.mensajes_whatsapp (whatsapp_message_id) where whatsapp_message_id is not null;

alter table public.mensajes_whatsapp enable row level security;

create policy "mensajes_whatsapp_select_own" on public.mensajes_whatsapp for select using (auth.uid () = user_id);

create policy "mensajes_whatsapp_insert_own" on public.mensajes_whatsapp for insert
with
  check (auth.uid () = user_id);

create policy "mensajes_whatsapp_update_own" on public.mensajes_whatsapp
for update
  using (auth.uid () = user_id);

create policy "mensajes_whatsapp_delete_own" on public.mensajes_whatsapp for delete using (auth.uid () = user_id);
