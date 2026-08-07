# Chat con IA (ficha de cliente + Inicio) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two persistent AI chats to PasoCRM — one scoped to a single cliente (replaces "Sugerencia del agente"), one general for the business (on Inicio) — both backed by a new `chat_agente` table, plus a minimal `/configuracion` page for the catalog/warranty text the general chat needs.

**Architecture:** Server Actions only (no API routes — CLAUDE.md forbids them for business logic), `claude-sonnet-5` via plain `messages.create` (no structured output, this is free-form chat), context built by reusing the existing agente/reportes/briefing services rather than duplicating logic.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (Postgres + RLS), `@anthropic-ai/sdk`, Zod, Tailwind. **No test framework is installed in this project** (confirmed via `package.json` — only `next dev`/`build` scripts, no vitest/jest). Every prior feature this session was verified with `pnpm lint` + `pnpm build` (TypeScript compiler) + a targeted manual/REST check, not unit tests — this plan follows the same pattern instead of introducing a new dependency to satisfy a TDD step that doesn't fit the codebase.

---

### Task 1: Migración — tablas `chat_agente` y `info_negocio`

**Files:**
- Create: `supabase/migrations/0005_chat_ia.sql`

- [ ] **Step 1: Escribir la migración**

```sql
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
```

- [ ] **Step 2: Aplicar la migración al proyecto real de Supabase**

Run (same flow used for `0004_link_cotizacion_externa.sql` earlier this session):

```powershell
npx supabase link --project-ref bphwxifkuiplpypyjsra
npx supabase db push
```

Expected: `{"upToDate":false,"dryRun":false,"migrations":["0005_chat_ia.sql"], ...}`.

- [ ] **Step 3: Verificar las tablas vía REST**

```powershell
node -e "
const fs = require('fs');
const env = fs.readFileSync('.env.local','utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(\S+)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(\S+)/)[1].trim();
Promise.all([
  fetch(url + '/rest/v1/chat_agente?select=id&limit=1', { headers: { apikey: key, Authorization: 'Bearer ' + key } }).then(r => r.json()),
  fetch(url + '/rest/v1/info_negocio?select=id&limit=1', { headers: { apikey: key, Authorization: 'Bearer ' + key } }).then(r => r.json()),
]).then(([a,b]) => console.log(JSON.stringify({chat_agente:a, info_negocio:b})));
"
```

Expected: both print `[]` (empty array, not an error object) — confirms both tables exist and are queryable.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0005_chat_ia.sql
git commit -m "feat: tablas chat_agente e info_negocio"
```

---

### Task 2: Tipos TypeScript

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Agregar el tipo `RolChat` junto a los demás tipos de enum**

Add right after the `EstadoCotizacion` line (after `export type EstadoCotizacion = "enviada" | "vista" | "aceptada" | "vencida";`):

```typescript
export type RolChat = "user" | "assistant";
```

- [ ] **Step 2: Agregar las tablas al `Database` interface**

Insert a new `chat_agente` and `info_negocio` block inside `Tables`, right after the closing `};` of the `pedidos` table block (before the closing `};` of `Tables`):

```typescript
      chat_agente: {
        Row: {
          id: string;
          user_id: string;
          cliente_id: string | null;
          rol: RolChat;
          mensaje: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          cliente_id?: string | null;
          rol: RolChat;
          mensaje: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cliente_id?: string | null;
          rol?: RolChat;
          mensaje?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_agente_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      info_negocio: {
        Row: {
          id: string;
          user_id: string;
          contenido: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          contenido?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contenido?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
```

- [ ] **Step 3: Agregar los alias exportados al final del archivo**

Append after `export type ClienteConEtapa = ...`:

```typescript
export type MensajeChat = Database["public"]["Tables"]["chat_agente"]["Row"];
export type InfoNegocio = Database["public"]["Tables"]["info_negocio"]["Row"];
```

- [ ] **Step 4: Verificar que compila**

Run: `pnpm build`
Expected: `✓ Compiled successfully` and `Finished TypeScript` with no errors (the new tables aren't used anywhere yet, so this only checks the type additions themselves are syntactically valid).

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts
git commit -m "feat: tipos para chat_agente e info_negocio"
```

---

### Task 3: Validador Zod

**Files:**
- Create: `lib/validators/chat.schema.ts`

- [ ] **Step 1: Escribir el schema**

```typescript
import { z } from "zod";

export const EnviarMensajeSchema = z.object({
  clienteId: z.string().uuid().nullable(),
  mensaje: z.string().trim().min(1, "Escribe un mensaje."),
});

export type EnviarMensajeInput = z.infer<typeof EnviarMensajeSchema>;

export const GuardarInfoNegocioSchema = z.object({
  contenido: z.string().trim(),
});

export type GuardarInfoNegocioInput = z.infer<typeof GuardarInfoNegocioSchema>;
```

- [ ] **Step 2: Verificar que compila**

Run: `pnpm build` — expected: compiles clean (unused-but-valid module).

- [ ] **Step 3: Commit**

```bash
git add lib/validators/chat.schema.ts
git commit -m "feat: validador zod para el chat"
```

---

### Task 4: Capa de datos

**Files:**
- Create: `lib/data/chat.ts`

- [ ] **Step 1: Escribir `getHistorialChat` y `getInfoNegocio`**

```typescript
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MensajeChat, InfoNegocio } from "@/lib/types";

type DB = SupabaseClient<Database>;

/**
 * Últimos `limite` mensajes de un hilo (el de un cliente si se pasa
 * clienteId, o el chat general del negocio si es null), en orden
 * cronológico para mostrar. Se pide descendente + limit y se invierte, para
 * traer los MÁS RECIENTES `limite` mensajes, no los más viejos.
 */
export const getHistorialChat = cache(async function getHistorialChat(
  supabase: DB,
  clienteId: string | null,
  limite = 50
): Promise<MensajeChat[]> {
  let query = supabase
    .from("chat_agente")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);

  query = clienteId ? query.eq("cliente_id", clienteId) : query.is("cliente_id", null);

  const { data, error } = await query;

  if (error) {
    console.error("getHistorialChat:", error.message);
    return [];
  }
  return (data ?? []).reverse();
});

export const getInfoNegocio = cache(async function getInfoNegocio(
  supabase: DB
): Promise<InfoNegocio | null> {
  const { data, error } = await supabase.from("info_negocio").select("*").maybeSingle();

  if (error) {
    console.error("getInfoNegocio:", error.message);
    return null;
  }
  return data;
});
```

- [ ] **Step 2: Verificar que compila**

Run: `pnpm build` — expected: compiles clean.

- [ ] **Step 3: Commit**

```bash
git add lib/data/chat.ts
git commit -m "feat: capa de datos para chat_agente e info_negocio"
```

---

### Task 5: Exportar `formatearContexto` de `agente.ts`

**Files:**
- Modify: `lib/claude/agente.ts:70`

- [ ] **Step 1: Cambiar la firma de privada a exportada**

Change:

```typescript
function formatearContexto(ctx: ContextoCliente): string {
```

to:

```typescript
export function formatearContexto(ctx: ContextoCliente): string {
```

This is the only change to this file — `ContextoCliente` is already exported, so the chat context service (Task 6) can import both.

- [ ] **Step 2: Verificar que compila**

Run: `pnpm build` — expected: compiles clean, `sugerirProximaAccion` (which still calls `formatearContexto` internally) is unaffected by the export change.

- [ ] **Step 3: Commit**

```bash
git add lib/claude/agente.ts
git commit -m "refactor: exportar formatearContexto para reutilizarla en el chat"
```

---

### Task 6: Servicio de contexto para el chat

**Files:**
- Create: `lib/services/chatContexto.service.ts`

- [ ] **Step 1: Escribir los dos armadores de contexto**

```typescript
// Arma el bloque de contexto (texto plano) que reciben los dos chats de IA.
// El de cliente reutiliza el mismo formateo que ya usa "Sugerir" en
// lib/claude/agente.ts; el de negocio reutiliza los cálculos que ya arman
// el Panel de informes y el Briefing del día — nada nuevo, solo texto.

import type { ClienteConEtapa } from "@/lib/types";
import { formatearContexto, type ContextoCliente } from "@/lib/claude/agente";
import {
  contarNuevosEnPeriodo,
  clientesPorOrigen,
  clientesPorEtapaActual,
} from "@/lib/services/reportes.service";
import { generarAlertasBriefing } from "@/lib/services/briefing.service";
import type { PedidoReporte } from "@/lib/data/reportes";

export function construirContextoCliente(ctx: ContextoCliente): string {
  return formatearContexto(ctx);
}

export function construirContextoNegocio(
  clientes: ClienteConEtapa[],
  pedidos: PedidoReporte[]
): string {
  const lineas: string[] = [];

  const { actual } = contarNuevosEnPeriodo(
    clientes.map((c) => c.created_at),
    30
  );
  lineas.push(`Clientes nuevos en los últimos 30 días: ${actual}`);
  lineas.push(`Total de clientes registrados: ${clientes.length}`);

  lineas.push("");
  lineas.push("Clientes por origen:");
  for (const o of clientesPorOrigen(clientes)) {
    lineas.push(`- ${o.label}: ${o.value}`);
  }

  lineas.push("");
  lineas.push("Clientes por etapa actual del pipeline:");
  for (const e of clientesPorEtapaActual(clientes)) {
    lineas.push(`- ${e.label}: ${e.value}`);
  }

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const pedidosDelMes = pedidos.filter((p) => new Date(p.created_at) >= inicioMes);
  const totalVentasMes = pedidosDelMes.reduce((suma, p) => suma + p.monto, 0);
  lineas.push("");
  lineas.push(
    `Ventas de este mes: ${pedidosDelMes.length} pedidos, $${totalVentasMes.toLocaleString("es-CO")} en total.`
  );

  const alertas = generarAlertasBriefing(clientes);
  lineas.push("");
  lineas.push("Clientes que llevan tiempo sin acción o requieren seguimiento:");
  if (alertas.length === 0) {
    lineas.push("- Ninguno por ahora.");
  }
  for (const a of alertas.slice(0, 15)) {
    lineas.push(`- ${a.clienteNombre}: ${a.dias} días en ${a.etapaActual} (${a.regla})`);
  }

  return lineas.join("\n");
}
```

- [ ] **Step 2: Verificar que compila**

Run: `pnpm build` — expected: compiles clean. This exercises the imports from `reportes.service.ts` and `briefing.service.ts`, so a signature mismatch (e.g. `AlertaBriefing` field names) would surface here.

- [ ] **Step 3: Commit**

```bash
git add lib/services/chatContexto.service.ts
git commit -m "feat: servicio de contexto para los chats (cliente y negocio)"
```

---

### Task 7: Wrapper de Claude para el chat

**Files:**
- Create: `lib/claude/chat.ts`

- [ ] **Step 1: Escribir `responderChat`**

Uses plain `messages.create` (not `.parse`) since chat replies are free text, not structured JSON. Model is `claude-sonnet-5` with `thinking: {type: "disabled"}`, matching the exact pattern already used in `lib/claude/agente.ts` and `lib/claude/briefing.ts` elsewhere in this codebase — CLAUDE.md fixes the model at Sonnet for this project.

```typescript
import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Prompt base compartido por los dos chats (cliente y negocio). Cada
// llamada le agrega su propio bloque de contexto (ver
// lib/services/chatContexto.service.ts) más el contenido de info_negocio.
const SYSTEM_PROMPT_BASE = `Eres el asistente de ventas de PasoCRM para Dormiluna, una tienda de colchones, bases cama y almohadas en Colombia. Hablas con Edwin, el vendedor y dueño del negocio, por chat.

Tono: cercano, tuteando, sin tecnicismos ni lenguaje corporativo — como hablaría un vendedor de confianza. Cuando te pida un mensaje para un cliente, usa técnicas de neuroventas y urgencia suave, nunca presionando ni siendo agresivo.

Reglas estrictas:
- Nunca inventes precios, fechas, productos ni datos que no estén explícitamente en el contexto que te paso.
- Si te preguntan algo de catálogo, garantías u objeciones y no está en la información del negocio que te paso, dilo honestamente en vez de inventar.
- Responde en español, de forma directa y breve — esto es un chat, no un informe.`;

export interface MensajeConversacion {
  rol: "user" | "assistant";
  mensaje: string;
}

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (!cachedClient) cachedClient = new Anthropic();
  return cachedClient;
}

/**
 * Responde un turno de chat. `contextoEspecifico` es el bloque de cliente o
 * de negocio ya armado (lib/services/chatContexto.service.ts); `infoNegocio`
 * es el contenido editable de la tabla info_negocio, o null si Edwin
 * todavía no lo llenó.
 */
export async function responderChat(
  historial: MensajeConversacion[],
  contextoEspecifico: string,
  infoNegocio: string | null
): Promise<string> {
  const system = [
    SYSTEM_PROMPT_BASE,
    "",
    contextoEspecifico,
    ...(infoNegocio
      ? ["", "Información del negocio (catálogo, garantías, objeciones):", infoNegocio]
      : []),
  ].join("\n");

  const response = await getClient().messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    thinking: { type: "disabled" },
    system,
    messages: historial.map((m) => ({ role: m.rol, content: m.mensaje })),
  });

  const bloqueTexto = response.content.find(
    (bloque): bloque is Anthropic.TextBlock => bloque.type === "text"
  );
  if (!bloqueTexto) {
    throw new Error("El agente no devolvió una respuesta de texto.");
  }
  return bloqueTexto.text;
}
```

- [ ] **Step 2: Verificar que compila**

Run: `pnpm build` — expected: compiles clean.

- [ ] **Step 3: Commit**

```bash
git add lib/claude/chat.ts
git commit -m "feat: wrapper de Claude Sonnet para el chat conversacional"
```

---

### Task 8: Server Actions del chat

**Files:**
- Create: `app/actions/chat.actions.ts`

- [ ] **Step 1: Escribir `actionEnviarMensajeChat` y `actionGuardarInfoNegocio`**

Order matters: `historialPrevio` must be fetched **before** inserting the new user message, otherwise the just-inserted row would appear twice (once from the DB fetch, once from the explicit append).

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHistorialChat, getInfoNegocio } from "@/lib/data/chat";
import { getClienteConEtapa, getHistorialCliente, getClientesConEtapa } from "@/lib/data/clientes";
import { getCotizaciones } from "@/lib/data/cotizaciones";
import { getPedidos } from "@/lib/data/pedidos";
import { getPedidosReporte } from "@/lib/data/reportes";
import { responderChat, type MensajeConversacion } from "@/lib/claude/chat";
import {
  construirContextoCliente,
  construirContextoNegocio,
} from "@/lib/services/chatContexto.service";
import { EnviarMensajeSchema, GuardarInfoNegocioSchema } from "@/lib/validators/chat.schema";
import type { ActionResult } from "@/lib/action-result";
import type { MensajeChat, InfoNegocio } from "@/lib/types";

export async function actionEnviarMensajeChat(
  clienteId: string | null,
  mensaje: string
): Promise<ActionResult<MensajeChat>> {
  const parsed = EnviarMensajeSchema.safeParse({ clienteId, mensaje });
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const historialPrevio = await getHistorialChat(supabase, parsed.data.clienteId);
  const infoNegocio = await getInfoNegocio(supabase);

  const { data: mensajeUsuario, error: errorInsert } = await supabase
    .from("chat_agente")
    .insert({
      cliente_id: parsed.data.clienteId,
      rol: "user",
      mensaje: parsed.data.mensaje,
    })
    .select()
    .single();

  if (errorInsert || !mensajeUsuario) {
    return {
      data: null,
      error: errorInsert?.message ?? "No se pudo guardar el mensaje.",
    };
  }

  let contextoEspecifico: string;
  if (parsed.data.clienteId) {
    const [cliente, historialCliente, cotizaciones, pedidos] = await Promise.all([
      getClienteConEtapa(supabase, parsed.data.clienteId),
      getHistorialCliente(supabase, parsed.data.clienteId),
      getCotizaciones(supabase),
      getPedidos(supabase),
    ]);

    if (!cliente) {
      return { data: mensajeUsuario, error: "Cliente no encontrado." };
    }

    contextoEspecifico = construirContextoCliente({
      cliente,
      historial: historialCliente,
      cotizaciones: cotizaciones.filter((c) => c.cliente_id === parsed.data.clienteId),
      pedidos: pedidos.filter((p) => p.cliente_id === parsed.data.clienteId),
    });
  } else {
    const [clientes, pedidosReporte] = await Promise.all([
      getClientesConEtapa(supabase),
      getPedidosReporte(supabase),
    ]);
    contextoEspecifico = construirContextoNegocio(clientes, pedidosReporte);
  }

  const historialCompleto: MensajeConversacion[] = [
    ...historialPrevio.map((m) => ({ rol: m.rol, mensaje: m.mensaje })),
    { rol: "user", mensaje: parsed.data.mensaje },
  ];

  try {
    const respuesta = await responderChat(
      historialCompleto,
      contextoEspecifico,
      infoNegocio?.contenido || null
    );

    const { data: mensajeAsistente, error: errorAsistente } = await supabase
      .from("chat_agente")
      .insert({
        cliente_id: parsed.data.clienteId,
        rol: "assistant",
        mensaje: respuesta,
      })
      .select()
      .single();

    if (errorAsistente || !mensajeAsistente) {
      return {
        data: mensajeUsuario,
        error: errorAsistente?.message ?? "No se pudo guardar la respuesta.",
      };
    }

    if (parsed.data.clienteId) {
      revalidatePath(`/clientes/${parsed.data.clienteId}`);
    } else {
      revalidatePath("/dashboard");
    }

    return { data: mensajeAsistente, error: null };
  } catch (error) {
    console.error("actionEnviarMensajeChat:", error);
    return {
      data: mensajeUsuario,
      error: error instanceof Error ? error.message : "No se pudo generar la respuesta.",
    };
  }
}

export async function actionGuardarInfoNegocio(
  formData: FormData
): Promise<ActionResult<InfoNegocio>> {
  const parsed = GuardarInfoNegocioSchema.safeParse({
    contenido: formData.get("contenido"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "No autenticado." };
  }

  const { data, error } = await supabase
    .from("info_negocio")
    .upsert(
      {
        user_id: user.id,
        contenido: parsed.data.contenido,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error || !data) {
    return { data: null, error: error?.message ?? "No se pudo guardar." };
  }

  revalidatePath("/configuracion");
  return { data, error: null };
}
```

- [ ] **Step 2: Verificar que compila**

Run: `pnpm build` — expected: compiles clean. Pay attention to the `historialCompleto` array — if this errors with a type mismatch on `rol`, confirm `MensajeChat["rol"]` resolved to `RolChat` (`"user" | "assistant"`) and not `string` (would mean Task 2 Step 1 was skipped).

- [ ] **Step 3: Commit**

```bash
git add app/actions/chat.actions.ts
git commit -m "feat: server actions para enviar mensajes de chat y guardar info del negocio"
```

---

### Task 9: Componentes de chat compartidos

**Files:**
- Create: `components/chat/BurbujaMensaje.tsx`
- Create: `components/chat/CampoMensajeChat.tsx`

- [ ] **Step 1: `BurbujaMensaje.tsx`**

```tsx
import type { MensajeChat } from "@/lib/types";

export function BurbujaMensaje({
  mensaje,
}: {
  mensaje: Pick<MensajeChat, "id" | "rol" | "mensaje">;
}) {
  const esUsuario = mensaje.rol === "user";
  return (
    <div className={`flex ${esUsuario ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
          esUsuario
            ? "bg-primary text-primary-foreground"
            : "bg-[#1A1A1A] text-[#E5E5E5]"
        }`}
      >
        {mensaje.mensaje}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `CampoMensajeChat.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CampoMensajeChat({
  onEnviar,
  pending,
  placeholder = "Escribe tu pregunta...",
}: {
  onEnviar: (mensaje: string) => void;
  pending: boolean;
  placeholder?: string;
}) {
  const [valor, setValor] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const mensaje = valor.trim();
    if (!mensaje || pending) return;
    onEnviar(mensaje);
    setValor("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={placeholder}
        disabled={pending}
      />
      <Button type="submit" size="icon" disabled={pending || !valor.trim()}>
        <Send className="size-4" />
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Verificar que compila**

Run: `pnpm build` && `pnpm lint` — expected: both clean (these components aren't imported anywhere yet, so this only checks syntax/types).

- [ ] **Step 4: Commit**

```bash
git add components/chat/BurbujaMensaje.tsx components/chat/CampoMensajeChat.tsx
git commit -m "feat: burbuja de mensaje y campo de texto compartidos entre los dos chats"
```

---

### Task 10: Chat de la ficha del cliente (reemplaza Sugerencia del agente)

**Files:**
- Create: `components/pipeline/ChatAgente.tsx`
- Delete: `components/pipeline/SugerenciaAgente.tsx`
- Modify: `app/(dashboard)/clientes/[id]/page.tsx`

- [ ] **Step 1: Crear `ChatAgente.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { actionEnviarMensajeChat } from "@/app/actions/chat.actions";
import type { MensajeChat } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BurbujaMensaje } from "@/components/chat/BurbujaMensaje";
import { CampoMensajeChat } from "@/components/chat/CampoMensajeChat";

export function ChatAgente({
  clienteId,
  clienteNombre,
  historialInicial,
}: {
  clienteId: string;
  clienteNombre: string;
  historialInicial: MensajeChat[];
}) {
  const [mensajes, setMensajes] = useState(historialInicial);
  const [pending, setPending] = useState(false);

  async function enviar(mensaje: string) {
    setPending(true);
    setMensajes((prev) => [
      ...prev,
      {
        id: `optimista-${Date.now()}`,
        user_id: "",
        cliente_id: clienteId,
        rol: "user",
        mensaje,
        created_at: new Date().toISOString(),
      },
    ]);

    const result = await actionEnviarMensajeChat(clienteId, mensaje);
    setPending(false);

    if (!result.data) {
      toast.error(result.error);
      return;
    }
    setMensajes((prev) => [...prev, result.data]);
  }

  return (
    <div className="rounded-[14px] border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide text-[#555] uppercase">
          Chat con el agente
        </h2>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => enviar("¿Qué debería hacer ahora con este cliente?")}
          className="gap-1.5"
        >
          <Sparkles className="size-3.5" />
          Sugerir próxima acción
        </Button>
      </div>

      <div className="mb-4 flex max-h-[360px] flex-col gap-2.5 overflow-y-auto">
        {mensajes.length === 0 && (
          <p className="text-sm text-[#555]">
            Pregúntale al agente sobre {clienteNombre} — qué le escribes, qué
            cotizó, cuánto lleva sin responder, o pídele un mensaje de cierre.
          </p>
        )}
        {mensajes.map((m) => (
          <BurbujaMensaje key={m.id} mensaje={m} />
        ))}
        {pending && <p className="text-xs text-[#555]">Pensando...</p>}
      </div>

      <CampoMensajeChat onEnviar={enviar} pending={pending} />
    </div>
  );
}
```

- [ ] **Step 2: Borrar `SugerenciaAgente.tsx`**

```bash
rm "components/pipeline/SugerenciaAgente.tsx"
```

- [ ] **Step 3: Actualizar `app/(dashboard)/clientes/[id]/page.tsx`**

Change the import:

```typescript
import { SugerenciaAgente } from "@/components/pipeline/SugerenciaAgente";
```

to:

```typescript
import { ChatAgente } from "@/components/pipeline/ChatAgente";
import { getHistorialChat } from "@/lib/data/chat";
```

Change the data fetch — after the existing `const historial = await getHistorialCliente(supabase, id);` line, add:

```typescript
  const historialChat = await getHistorialChat(supabase, id);
```

Change the render — replace:

```tsx
      <div className="mb-6">
        <SugerenciaAgente clienteId={cliente.id} />
      </div>
```

with:

```tsx
      <div className="mb-6">
        <ChatAgente
          clienteId={cliente.id}
          clienteNombre={cliente.nombre}
          historialInicial={historialChat}
        />
      </div>
```

- [ ] **Step 4: Verificar que compila**

Run: `pnpm build` && `pnpm lint` — expected: both clean. Confirm `agente.actions.ts` and `lib/claude/agente.ts` are **not** flagged as unused — `BotonMensajeIA.tsx` (the "Mensaje" action in the Lista de clientes table for etapa "Cotizó") still imports `actionSugerirProximaAccion` from `agente.actions.ts`, so that file must not be deleted.

- [ ] **Step 5: Commit**

```bash
git add components/pipeline/ChatAgente.tsx "app/(dashboard)/clientes/[id]/page.tsx"
git rm components/pipeline/SugerenciaAgente.tsx
git commit -m "feat: chat con el agente en la ficha del cliente, reemplaza Sugerencia del agente"
```

---

### Task 11: Chat general del negocio en Inicio

**Files:**
- Create: `components/dashboard/ChatNegocio.tsx`
- Modify: `app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Crear `ChatNegocio.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { actionEnviarMensajeChat } from "@/app/actions/chat.actions";
import type { MensajeChat } from "@/lib/types";
import { BurbujaMensaje } from "@/components/chat/BurbujaMensaje";
import { CampoMensajeChat } from "@/components/chat/CampoMensajeChat";

export function ChatNegocio({ historialInicial }: { historialInicial: MensajeChat[] }) {
  const [mensajes, setMensajes] = useState(historialInicial);
  const [pending, setPending] = useState(false);

  async function enviar(mensaje: string) {
    setPending(true);
    setMensajes((prev) => [
      ...prev,
      {
        id: `optimista-${Date.now()}`,
        user_id: "",
        cliente_id: null,
        rol: "user",
        mensaje,
        created_at: new Date().toISOString(),
      },
    ]);

    const result = await actionEnviarMensajeChat(null, mensaje);
    setPending(false);

    if (!result.data) {
      toast.error(result.error);
      return;
    }
    setMensajes((prev) => [...prev, result.data]);
  }

  return (
    <div className="mb-8 rounded-[14px] border border-border bg-card p-5">
      <h2 className="mb-4 text-xs font-semibold tracking-wide text-[#555] uppercase">
        Chat del negocio
      </h2>

      <div className="mb-4 flex h-[380px] flex-col gap-2.5 overflow-y-auto">
        {mensajes.length === 0 && (
          <p className="text-sm text-[#555]">
            Pregúntale al agente sobre tu negocio: cuántos leads tienes,
            quién lleva más tiempo sin responder, cuántas ventas cerraste
            este mes, o pídele un mensaje para publicar en redes.
          </p>
        )}
        {mensajes.map((m) => (
          <BurbujaMensaje key={m.id} mensaje={m} />
        ))}
        {pending && <p className="text-xs text-[#555]">Pensando...</p>}
      </div>

      <CampoMensajeChat
        onEnviar={enviar}
        pending={pending}
        placeholder="Pregúntale algo a tu negocio..."
      />
    </div>
  );
}
```

- [ ] **Step 2: Wire it into `app/(dashboard)/dashboard/page.tsx`**

Add to the imports:

```typescript
import { ChatNegocio } from "@/components/dashboard/ChatNegocio";
import { getHistorialChat } from "@/lib/data/chat";
```

In the `Promise.all` that fetches `clientes, actividad, seguimientos`, add a fourth fetch. Find:

```typescript
  const [clientes, actividad, seguimientos] = await Promise.all([
    getClientesConEtapa(supabase),
    getActividadReciente(supabase, 5),
    getTodosLosSeguimientos(supabase),
  ]);
```

replace with:

```typescript
  const [clientes, actividad, seguimientos, historialChat] = await Promise.all([
    getClientesConEtapa(supabase),
    getActividadReciente(supabase, 5),
    getTodosLosSeguimientos(supabase),
    getHistorialChat(supabase, null),
  ]);
```

Then render it right after the KPI grid, before the "Actividad reciente" / "Pipeline" two-column section. Find:

```tsx
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[14px] border border-border bg-card p-5">
          <div className="mb-4 text-xs font-semibold tracking-wide text-[#555] uppercase">
            Actividad reciente
          </div>
```

and insert directly above it:

```tsx
      <ChatNegocio historialInicial={historialChat} />

```

- [ ] **Step 3: Verificar que compila**

Run: `pnpm build` && `pnpm lint` — expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/ChatNegocio.tsx "app/(dashboard)/dashboard/page.tsx"
git commit -m "feat: chat general del negocio en Inicio"
```

---

### Task 12: Página de Configuración (edita `info_negocio`)

**Files:**
- Create: `components/configuracion/FormularioInfoNegocio.tsx`
- Create: `app/(dashboard)/configuracion/page.tsx`
- Modify: `components/dashboard/SidebarNav.tsx`

- [ ] **Step 1: Crear `FormularioInfoNegocio.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { actionGuardarInfoNegocio } from "@/app/actions/chat.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function FormularioInfoNegocio({
  contenidoInicial,
}: {
  contenidoInicial: string;
}) {
  const [contenido, setContenido] = useState(contenidoInicial);
  const [pending, startTransition] = useTransition();

  function guardar() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("contenido", contenido);
      const result = await actionGuardarInfoNegocio(formData);
      if (result.data) {
        toast.success("Información guardada.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="max-w-2xl rounded-[14px] border border-border bg-card p-6">
      <div className="mb-4 flex flex-col gap-2">
        <Label htmlFor="contenido">Catálogo, garantías y objeciones</Label>
        <Textarea
          id="contenido"
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          rows={16}
          placeholder="Ej: El colchón ortopédico XL tiene garantía de 10 años contra hundimiento..."
        />
      </div>
      <Button onClick={guardar} disabled={pending}>
        {pending ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Crear `app/(dashboard)/configuracion/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import { getInfoNegocio } from "@/lib/data/chat";
import { FormularioInfoNegocio } from "@/components/configuracion/FormularioInfoNegocio";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const infoNegocio = await getInfoNegocio(supabase);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight text-white">
          Configuración
        </h1>
        <p className="mt-0.5 text-[13px] text-[#444]">
          Catálogo, garantías y objeciones — el agente de IA lee esto para
          responder preguntas del negocio.
        </p>
      </div>

      <FormularioInfoNegocio contenidoInicial={infoNegocio?.contenido ?? ""} />
    </div>
  );
}
```

- [ ] **Step 3: Agregar "Configuración" al menú lateral**

In `components/dashboard/SidebarNav.tsx`, change:

```typescript
import { LayoutGrid, Users, BarChart3, ListChecks } from "lucide-react";
```

to:

```typescript
import { LayoutGrid, Users, BarChart3, ListChecks, Settings } from "lucide-react";
```

and add a new entry to `NAV_ITEMS` (after the "Reportes" entry):

```typescript
  { href: "/configuracion", label: "Configuración", icon: Settings },
```

- [ ] **Step 4: Verificar que compila**

Run: `pnpm build` — expected: new route `/configuracion` appears in the build output route list, no errors.

- [ ] **Step 5: Commit**

```bash
git add components/configuracion/FormularioInfoNegocio.tsx "app/(dashboard)/configuracion/page.tsx" components/dashboard/SidebarNav.tsx
git commit -m "feat: pagina de configuracion para editar catalogo/garantias/objeciones"
```

---

### Task 13: Verificación final y push

**Files:** none (verification only)

- [ ] **Step 1: Build y lint completos**

Run: `pnpm lint && pnpm build`
Expected: both exit clean; the route list in the build output includes `/configuracion` alongside the existing routes (`/dashboard`, `/clientes`, `/clientes/[id]`, `/tareas`, `/reportes`, etc.).

- [ ] **Step 2: Smoke test manual (no hay browser automation disponible en este entorno)**

Con el dev server corriendo (`pnpm dev`) y sesión iniciada en el navegador:

1. Abrir una ficha de cliente (`/clientes/<id>`) — confirmar que aparece "Chat con el agente" (no "Sugerencia del agente"), escribir una pregunta, confirmar que responde y que sigue ahí al recargar la página.
2. Click en "Sugerir próxima acción" — confirmar que dispara el mismo flujo con el mensaje precargado.
3. Ir a Inicio (`/dashboard`) — confirmar que aparece "Chat del negocio" debajo de los KPIs, escribir una pregunta como "¿cuántos clientes tengo?", confirmar respuesta con datos reales.
4. Ir a "Configuración", escribir un texto de garantía, guardar, volver al Chat del negocio y preguntar sobre esa garantía — confirmar que la respuesta la usa.
5. Confirmar en la tabla Lista de `/clientes` (filtro etapa=cotizo) que el botón "Mensaje" sigue funcionando (prueba de que `agente.actions.ts` no se rompió).

- [ ] **Step 3: Push**

```bash
git push origin main
```
