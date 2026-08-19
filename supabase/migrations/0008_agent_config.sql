-- PasoCRM — historial de system prompts probados en /entrenamiento. Esta
-- tabla NO alimenta al chat real en producción (ese sigue leyendo
-- SYSTEM_PROMPT_BASE, una constante en lib/claude/chat.ts) — es solo
-- referencia hasta que alguien copie a mano el prompt ganador al código.

create table if not exists public.agent_config (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  system_prompt text not null,
  nivel_ia text not null default 'basico' check (nivel_ia in ('basico', 'avanzado')),
  use_rag boolean not null default true,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.agent_config is 'Historial de system prompts probados en /entrenamiento. Solo referencia — el chat real sigue usando la constante en lib/claude/chat.ts hasta que se copie a mano.';

create index if not exists agent_config_user_id_idx on public.agent_config (user_id);

-- Garantiza a nivel de base de datos que solo puede haber una fila activa
-- por usuario, sin depender de que la app lo respete siempre.
create unique index if not exists agent_config_una_activa_idx on public.agent_config (user_id) where (is_active);

alter table public.agent_config enable row level security;

create policy "agent_config_select_own" on public.agent_config for select using (auth.uid () = user_id);

create policy "agent_config_insert_own" on public.agent_config for insert
with
  check (auth.uid () = user_id);

create policy "agent_config_update_own" on public.agent_config
for update
  using (auth.uid () = user_id);
