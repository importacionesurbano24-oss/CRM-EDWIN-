# /entrenamiento — sandbox de prueba del agente interno — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir `/entrenamiento`, una página interna donde Edwin edita el system
prompt del chat interno del agente, lo prueba en una conversación simulada que no se
guarda en `chat_agente`, y ve un panel de debug (modelo usado, razón, tokens,
fragmentos RAG recuperados).

**Architecture:** Server Action nueva (`entrenamiento.actions.ts`) que reutiliza la
lógica existente de `lib/claude/chat.ts` (`responderChat`) con un parámetro opcional
de override de prompt y datos de uso/tokens agregados al tipo de retorno. Una tabla
nueva `agent_config` guarda prompts de referencia (no afecta producción). Tres paneles
cliente (editor, chat simulado, debug) orquestados por un componente de página.

**Tech Stack:** Next.js App Router, Server Actions, Supabase (Postgres + RLS),
Anthropic SDK (`@anthropic-ai/sdk`), Zod, Tailwind, shadcn/ui (base-ui).

**Sin test runner:** este proyecto no tiene Jest/Vitest configurado (`package.json`
solo define `dev`/`build`/`start`/`lint`). No se agrega uno para esta feature (fuera
de alcance, decisión del usuario). La verificación por tarea es `pnpm exec tsc
--noEmit` (rápido, detecta errores de tipos e imports rotos); el build/lint completo y
la prueba manual en navegador quedan para la última tarea.

---

### Task 0: Crear worktree y rama de feature

El repo ya usa `git worktree` para features grandes (ver `.worktrees/rediseno-conocimiento`
→ rama `feature/rediseno-conocimiento`). Esta feature toca archivos compartidos
(`lib/claude/chat.ts`, `lib/claude/modelos.ts`, `lib/types.ts`, el sidebar, y el
heading de `/conocimiento`), así que conviene aislarla igual.

- [x] **Paso 1: Crear el worktree**

```bash
cd "c:/Users/Urban/Desktop/CRM EDWIN"
git worktree add .worktrees/entrenamiento -b feature/entrenamiento
```

- [x] **Paso 2: Instalar dependencias en el worktree**

```bash
cd "c:/Users/Urban/Desktop/CRM EDWIN/.worktrees/entrenamiento"
pnpm install
```

Expected: instala sin errores (mismo `pnpm-lock.yaml` que main).

A partir de acá, **todos los comandos y ediciones de este plan se hacen dentro de**
`c:/Users/Urban/Desktop/CRM EDWIN/.worktrees/entrenamiento`, no en el checkout
principal.

---

### Task 1: Migración SQL — tabla `agent_config`

**Files:**
- Create: `supabase/migrations/0008_agent_config.sql`

- [ ] **Paso 1: Escribir la migración**

```sql
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
```

- [ ] **Paso 2: Aplicar la migración al proyecto real de Supabase**

Este proyecto no corre las migraciones automáticamente (ver README / estado del
proyecto en CLAUDE.md — "falta correr 0003_pedidos.sql" quedó pendiente en su momento
del mismo modo). Pega el contenido de `0008_agent_config.sql` en el SQL Editor de
Supabase (proyecto real, el mismo de `.env.local`) y ejecútalo. Confirma en el
Table Editor que `agent_config` existe con RLS activado.

- [x] **Paso 3: Commit**

```bash
git add supabase/migrations/0008_agent_config.sql
git commit -m "feat: agrega tabla agent_config para /entrenamiento"
```

**Estado: DONE — commit `6f76dff`. Spec review ✅. Code quality review ✅ (sin issues críticos ni importantes).**

---

### Task 2: Tipos de Supabase — `lib/types.ts`

**Files:**
- Modify: `lib/types.ts`

- [ ] **Paso 1: Agregar el tipo `NivelIaConfig` junto a los otros enums locales**

```ts
// Buscar esta línea (ya existe en el archivo):
export type DireccionMensaje = "entrante" | "saliente";
```

Reemplazar por:

```ts
export type DireccionMensaje = "entrante" | "saliente";
export type NivelIaConfig = "basico" | "avanzado";
```

- [ ] **Paso 2: Agregar la tabla `agent_config` dentro de `Tables`**

Buscar el cierre de `conocimiento_negocio` (el bloque termina así, justo antes de
`};` que cierra `Tables:` y de `Views: {`):

```ts
        Update: {
          id?: string;
          user_id?: string;
          seccion?: SeccionConocimiento;
          contenido?: string;
          embedding?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
```

Reemplazar por (agrega `agent_config` antes del `};` que cierra `Tables`):

```ts
        Update: {
          id?: string;
          user_id?: string;
          seccion?: SeccionConocimiento;
          contenido?: string;
          embedding?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_config: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          system_prompt: string;
          nivel_ia: NivelIaConfig;
          use_rag: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          system_prompt: string;
          nivel_ia?: NivelIaConfig;
          use_rag?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          system_prompt?: string;
          nivel_ia?: NivelIaConfig;
          use_rag?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
```

- [ ] **Paso 3: Agregar el tipo exportado `AgentConfig`**

Buscar el final del archivo:

```ts
export type ConocimientoNegocio =
  Database["public"]["Tables"]["conocimiento_negocio"]["Row"];
```

Reemplazar por:

```ts
export type ConocimientoNegocio =
  Database["public"]["Tables"]["conocimiento_negocio"]["Row"];
export type AgentConfig = Database["public"]["Tables"]["agent_config"]["Row"];
```

- [ ] **Paso 4: Verificar tipos**

```bash
pnpm exec tsc --noEmit
```

Expected: sin errores nuevos relacionados a `lib/types.ts` (el archivo compila solo
con tipos, no hay lógica que probar todavía).

- [x] **Paso 5: Commit**

```bash
git add lib/types.ts
git commit -m "feat: agrega tipos de agent_config a lib/types.ts"
```

**Estado: DONE — commit `0ca3185`. Spec review ✅. Code quality review ✅ (1 nit cosmético de orden, sin acción).**

---

### Task 3: `explicarNivelIA` en `lib/claude/modelos.ts`

**Files:**
- Modify: `lib/claude/modelos.ts`

- [ ] **Paso 1: Reemplazar la heurística actual por una versión que también explica la razón**

Buscar (es el final del archivo completo):

```ts
/**
 * Heurística de fallback — solo para interacción directa con clientes
 * (agente.ts, chat.ts, whatsapp.ts). Devuelve "avanzado" si el texto
 * muestra señales de objeción o negociación: dudas de precio/descuento,
 * comparación con otra marca o "está muy caro", desconfianza o quejas,
 * negociación de forma de pago/financiación, o un mensaje largo con
 * varias preguntas encadenadas. Para todo lo demás devuelve "basico".
 */
export function decidirNivelIA(mensaje: string): NivelIA {
  const texto = mensaje.toLowerCase();

  const señalesDeObjecion = [
    /\b(descuento|rebaja|muy car[oa]|carísim[oa])\b/,
    /\b(otra marca|otra tienda|más barato|competencia)\b/,
    /\b(no confío|desconfío|estafa|queja|reclamo|molest[oa]|enojad[oa]|mal servicio|no me gustó|insatisfech[oa])\b/,
    /\b(cuotas|financiaci[oó]n|a plazos|crédito|pago inicial|separado)\b/,
  ];

  if (señalesDeObjecion.some((patron) => patron.test(texto))) {
    return "avanzado";
  }

  const preguntas = (texto.match(/\?/g) ?? []).length;
  if (preguntas >= 3 || texto.length > 600) {
    return "avanzado";
  }

  return "basico";
}
```

Reemplazar por:

```ts
// Patrones de objeción compartidos por decidirNivelIA y explicarNivelIA — un
// solo lugar para que las dos funciones no se desalineen si se ajustan las
// reglas más adelante.
const SEÑALES_DE_OBJECION: { patron: RegExp; razon: string }[] = [
  {
    patron: /\b(descuento|rebaja|muy car[oa]|carísim[oa])\b/,
    razon: "El mensaje menciona precio, descuento o queja de que está caro.",
  },
  {
    patron: /\b(otra marca|otra tienda|más barato|competencia)\b/,
    razon: "El mensaje compara con otra marca, tienda o la competencia.",
  },
  {
    patron: /\b(no confío|desconfío|estafa|queja|reclamo|molest[oa]|enojad[oa]|mal servicio|no me gustó|insatisfech[oa])\b/,
    razon: "El mensaje muestra desconfianza o una queja.",
  },
  {
    patron: /\b(cuotas|financiaci[oó]n|a plazos|crédito|pago inicial|separado)\b/,
    razon: "El mensaje pregunta por forma de pago o financiación.",
  },
];

/**
 * Heurística de fallback — solo para interacción directa con clientes
 * (agente.ts, chat.ts, whatsapp.ts). Devuelve "avanzado" si el texto
 * muestra señales de objeción o negociación: dudas de precio/descuento,
 * comparación con otra marca o "está muy caro", desconfianza o quejas,
 * negociación de forma de pago/financiación, o un mensaje largo con
 * varias preguntas encadenadas. Para todo lo demás devuelve "basico".
 */
export function decidirNivelIA(mensaje: string): NivelIA {
  return explicarNivelIA(mensaje).nivel;
}

/**
 * Igual que decidirNivelIA, pero además devuelve por qué se eligió ese
 * nivel. Lo usa el panel de debug de /entrenamiento cuando el modo de
 * modelo es "Automático", para mostrarle a Edwin la razón del escalado.
 */
export function explicarNivelIA(mensaje: string): { nivel: NivelIA; razon: string } {
  const texto = mensaje.toLowerCase();

  const señal = SEÑALES_DE_OBJECION.find(({ patron }) => patron.test(texto));
  if (señal) {
    return { nivel: "avanzado", razon: señal.razon };
  }

  const preguntas = (texto.match(/\?/g) ?? []).length;
  if (preguntas >= 3) {
    return { nivel: "avanzado", razon: "El mensaje encadena 3 o más preguntas." };
  }
  if (texto.length > 600) {
    return { nivel: "avanzado", razon: "El mensaje es largo (más de 600 caracteres)." };
  }

  return { nivel: "basico", razon: "No se detectaron señales de objeción ni negociación." };
}
```

- [ ] **Paso 2: Verificar tipos**

```bash
pnpm exec tsc --noEmit
```

Expected: sin errores nuevos. `decidirNivelIA` sigue exportada con la misma firma —
nada que la use en `agente.ts`/`chat.ts`/`whatsapp.ts` debería romperse.

- [ ] **Paso 3: Confirmar manualmente que el comportamiento no cambió**

```bash
node -e "
const { decidirNivelIA, explicarNivelIA } = require('./lib/claude/modelos.ts');
" 2>&1 | head -5
```

Esto va a fallar porque `node` no entiende `.ts` directo — en vez de eso, verificar
leyendo el archivo: confirmar que `decidirNivelIA('me parece muy caro')` sigue
devolviendo `'avanzado'` razonando el código a mano (contiene "muy car" → matchea el
primer patrón). No hace falta un test runner para esto; el refactor es mecánico
(mismos regex, mismo orden de chequeos) y `tsc --noEmit` ya confirmó que los tipos
cierran.

- [x] **Paso 4: Commit**

```bash
git add lib/claude/modelos.ts
git commit -m "feat: agrega explicarNivelIA para el panel de debug de /entrenamiento"
```

**Estado: DONE — commit `d0a9da0`. Spec review ✅ (regex byte-a-byte verificados). Code quality review ✅.**

---

### Task 4: `responderChat` con override de prompt y métricas — `lib/claude/chat.ts`

**Files:**
- Modify: `lib/claude/chat.ts`

- [ ] **Paso 1: Extender `RespuestaChat` y la firma de `responderChat`**

Buscar:

```ts
export interface RespuestaChat {
  texto: string;
  /** Mensaje listo para enviar al cliente por WhatsApp, o null si esta respuesta no es un mensaje para el cliente. */
  mensajeParaCliente: string | null;
}
```

Reemplazar por:

```ts
export interface RespuestaChat {
  texto: string;
  /** Mensaje listo para enviar al cliente por WhatsApp, o null si esta respuesta no es un mensaje para el cliente. */
  mensajeParaCliente: string | null;
  /** Modelo real usado en esta llamada (ej. "claude-haiku-4-5"). Lo usa el panel de debug de /entrenamiento. */
  modeloUsado: string;
  nivelResuelto: NivelIA;
  tokensEntrada: number;
  tokensSalida: number;
}
```

Buscar:

```ts
export async function responderChat(
  historial: MensajeConversacion[],
  contextoEspecifico: string,
  fragmentos: FragmentoConocimiento[],
  nivel?: NivelIA
): Promise<RespuestaChat> {
  const system = [
    SYSTEM_PROMPT_BASE,
    "",
    contextoEspecifico,
```

Reemplazar por:

```ts
export async function responderChat(
  historial: MensajeConversacion[],
  contextoEspecifico: string,
  fragmentos: FragmentoConocimiento[],
  nivel?: NivelIA,
  /** Solo para /entrenamiento — permite probar un system prompt distinto al
   * de producción sin tocar la constante. Si no viene, el comportamiento es
   * idéntico al de siempre. */
  opciones?: { systemPromptOverride?: string }
): Promise<RespuestaChat> {
  const system = [
    opciones?.systemPromptOverride ?? SYSTEM_PROMPT_BASE,
    "",
    contextoEspecifico,
```

Buscar:

```ts
  if (!response.parsed_output) {
    throw new Error("El agente no devolvió una respuesta válida.");
  }

  return {
    texto: response.parsed_output.respuesta,
    mensajeParaCliente: response.parsed_output.mensaje_para_cliente,
  };
}
```

Reemplazar por:

```ts
  if (!response.parsed_output) {
    throw new Error("El agente no devolvió una respuesta válida.");
  }

  return {
    texto: response.parsed_output.respuesta,
    mensajeParaCliente: response.parsed_output.mensaje_para_cliente,
    modeloUsado: MODELOS_IA[nivelResuelto],
    nivelResuelto,
    tokensEntrada: response.usage.input_tokens,
    tokensSalida: response.usage.output_tokens,
  };
}
```

- [ ] **Paso 2: Verificar tipos**

```bash
pnpm exec tsc --noEmit
```

Expected: sin errores. `chat.actions.ts` (el único caller real hoy) sigue funcionando
porque los 4 campos nuevos son adicionales — nada que use `RespuestaChat` desestructura
solo `{texto, mensajeParaCliente}` así que no se rompe.

- [x] **Paso 3: Commit**

```bash
git add lib/claude/chat.ts
git commit -m "feat: responderChat acepta override de prompt y devuelve métricas de uso"
```

**Estado: DONE — commit `15f83dc`. Spec review ✅ (caller sin diff, `??` correcto). Code quality review ✅ (nits menores de doc, no bloqueantes).**

---

### Task 5: Validadores — `lib/validators/entrenamiento.schema.ts`

**Files:**
- Create: `lib/validators/entrenamiento.schema.ts`

- [ ] **Paso 1: Escribir el schema**

```ts
import { z } from "zod";

export const EnviarMensajeEntrenamientoSchema = z.object({
  clienteId: z.string().uuid().nullable(),
  mensaje: z.string().trim().min(1, "Escribe un mensaje."),
  systemPrompt: z.string().trim().min(1, "El system prompt no puede estar vacío."),
  modoModelo: z.enum(["basico", "avanzado", "auto"]),
  useRag: z.boolean(),
});

export type EnviarMensajeEntrenamientoInput = z.infer<
  typeof EnviarMensajeEntrenamientoSchema
>;

export const GuardarPromptActivoSchema = z.object({
  name: z.string().trim().min(1, "Falta el nombre de esta versión."),
  systemPrompt: z.string().trim().min(1, "El system prompt no puede estar vacío."),
  nivelIa: z.enum(["basico", "avanzado"]),
  useRag: z.boolean(),
});

export type GuardarPromptActivoInput = z.infer<typeof GuardarPromptActivoSchema>;
```

- [ ] **Paso 2: Verificar tipos**

```bash
pnpm exec tsc --noEmit
```

Expected: sin errores.

- [x] **Paso 3: Commit**

```bash
git add lib/validators/entrenamiento.schema.ts
git commit -m "feat: agrega schemas Zod para las Server Actions de /entrenamiento"
```

**Estado: DONE — commit `4736ab4`. Spec review ✅. Code quality review ✅.**

---

### Task 6: Server Actions — `app/actions/entrenamiento.actions.ts`

**Files:**
- Create: `app/actions/entrenamiento.actions.ts`

- [ ] **Paso 1: Escribir el archivo completo**

```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getClienteConEtapa,
  getHistorialCliente,
  getClientesConEtapa,
} from "@/lib/data/clientes";
import { getCotizaciones } from "@/lib/data/cotizaciones";
import { getPedidos } from "@/lib/data/pedidos";
import { getMensajesWhatsapp } from "@/lib/data/whatsapp";
import { getPedidosReporte } from "@/lib/data/reportes";
import { responderChat, type MensajeConversacion } from "@/lib/claude/chat";
import {
  buscarConocimientoRelevante,
  type FragmentoConocimiento,
} from "@/lib/services/conocimiento.service";
import {
  construirContextoCliente,
  construirContextoNegocio,
} from "@/lib/services/chatContexto.service";
import { explicarNivelIA, type NivelIA } from "@/lib/claude/modelos";
import {
  EnviarMensajeEntrenamientoSchema,
  GuardarPromptActivoSchema,
  type EnviarMensajeEntrenamientoInput,
  type GuardarPromptActivoInput,
} from "@/lib/validators/entrenamiento.schema";
import type { ActionResult } from "@/lib/action-result";
import type { AgentConfig } from "@/lib/types";

export interface TurnoEntrenamiento {
  texto: string;
  mensajeParaCliente: string | null;
  modeloUsado: string;
  nivelResuelto: NivelIA;
  razon: string;
  tokensEntrada: number;
  tokensSalida: number;
  ragChunks: FragmentoConocimiento[];
  timestamp: string;
}

/**
 * Igual que actionEnviarMensajeChat (chat.actions.ts) pero para el sandbox
 * de /entrenamiento: no inserta nada en chat_agente, no revalida ninguna
 * ruta, y admite override de system prompt / modelo forzado / RAG on-off.
 */
export async function actionEnviarMensajeEntrenamiento(
  input: EnviarMensajeEntrenamientoInput,
  historialPrevio: MensajeConversacion[]
): Promise<ActionResult<TurnoEntrenamiento>> {
  const parsed = EnviarMensajeEntrenamientoSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }
  const { clienteId, mensaje, systemPrompt, modoModelo, useRag } = parsed.data;

  const supabase = await createClient();

  const fragmentos = useRag
    ? await buscarConocimientoRelevante(supabase, mensaje)
    : [];

  let contextoEspecifico: string;
  if (clienteId) {
    const [cliente, historialCliente, cotizaciones, pedidos, mensajesWhatsapp] =
      await Promise.all([
        getClienteConEtapa(supabase, clienteId),
        getHistorialCliente(supabase, clienteId),
        getCotizaciones(supabase),
        getPedidos(supabase),
        getMensajesWhatsapp(supabase, clienteId),
      ]);

    if (!cliente) {
      return { data: null, error: "Cliente no encontrado." };
    }

    contextoEspecifico = construirContextoCliente({
      cliente,
      historial: historialCliente,
      cotizaciones: cotizaciones.filter((c) => c.cliente_id === clienteId),
      pedidos: pedidos.filter((p) => p.cliente_id === clienteId),
      mensajesWhatsapp,
    });
  } else {
    const [clientes, pedidosReporte] = await Promise.all([
      getClientesConEtapa(supabase),
      getPedidosReporte(supabase),
    ]);
    contextoEspecifico = construirContextoNegocio(clientes, pedidosReporte);
  }

  const historialCompleto: MensajeConversacion[] = [
    ...historialPrevio,
    { rol: "user", mensaje },
  ];

  const nivelForzado = modoModelo === "auto" ? undefined : modoModelo;
  const razon =
    modoModelo === "auto"
      ? explicarNivelIA(mensaje).razon
      : `Forzado manualmente a ${modoModelo === "basico" ? "Haiku" : "Sonnet"}.`;

  try {
    const respuesta = await responderChat(
      historialCompleto,
      contextoEspecifico,
      fragmentos,
      nivelForzado,
      { systemPromptOverride: systemPrompt }
    );

    return {
      data: {
        texto: respuesta.texto,
        mensajeParaCliente: respuesta.mensajeParaCliente,
        modeloUsado: respuesta.modeloUsado,
        nivelResuelto: respuesta.nivelResuelto,
        razon,
        tokensEntrada: respuesta.tokensEntrada,
        tokensSalida: respuesta.tokensSalida,
        ragChunks: fragmentos,
        timestamp: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    console.error("actionEnviarMensajeEntrenamiento:", error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "No se pudo generar la respuesta.",
    };
  }
}

/** Desactiva la fila activa anterior (si hay) e inserta una nueva activa. */
export async function actionGuardarPromptActivo(
  input: GuardarPromptActivoInput
): Promise<ActionResult<AgentConfig>> {
  const parsed = GuardarPromptActivoSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const { error: errorDesactivar } = await supabase
    .from("agent_config")
    .update({ is_active: false })
    .eq("is_active", true);

  if (errorDesactivar) {
    return { data: null, error: errorDesactivar.message };
  }

  const { data, error } = await supabase
    .from("agent_config")
    .insert({
      name: parsed.data.name,
      system_prompt: parsed.data.systemPrompt,
      nivel_ia: parsed.data.nivelIa,
      use_rag: parsed.data.useRag,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    return { data: null, error: error?.message ?? "No se pudo guardar el prompt." };
  }

  return { data, error: null };
}

export async function actionCargarPromptActivo(): Promise<
  ActionResult<AgentConfig | null>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agent_config")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
```

- [ ] **Paso 2: Verificar tipos**

```bash
pnpm exec tsc --noEmit
```

Expected: sin errores. Si aparece un error sobre `supabase.from("agent_config")` no
reconocido, confirmar que Task 2 (tipos) se completó y que este archivo importa
`AgentConfig` desde `@/lib/types` (no desde otro lado).

- [x] **Paso 3: Commit**

```bash
git add app/actions/entrenamiento.actions.ts
git commit -m "feat: agrega Server Actions de /entrenamiento (sin guardar en chat_agente)"
```

**Estado: DONE — commit `68bcef6`. Spec review ✅. Code quality review ✅ (ready to merge).**
**Nota de seguimiento (no bloqueante):** el bloque de armado de contexto (cliente/negocio) quedó duplicado entre `chat.actions.ts` y este archivo — candidato a extraer a un helper compartido en `chatContexto.service.ts` en una limpieza futura, fuera de alcance de este plan.

---

### Task 7: Selector de modelo de 3 vías — `components/entrenamiento/SelectorModoModelo.tsx`

**Files:**
- Create: `components/entrenamiento/SelectorModoModelo.tsx`

- [ ] **Paso 1: Escribir el componente**

```tsx
"use client";

import { Zap, Target, Wand2 } from "lucide-react";
import type { NivelIA } from "@/lib/claude/modelos";

export type ModoModelo = NivelIA | "auto";

const OPCIONES: {
  valor: ModoModelo;
  label: string;
  titulo: string;
  icono: typeof Zap;
}[] = [
  {
    valor: "basico",
    label: "Haiku",
    titulo: "Fuerza el modelo básico (Haiku) en toda la prueba.",
    icono: Zap,
  },
  {
    valor: "avanzado",
    label: "Sonnet",
    titulo: "Fuerza el modelo avanzado (Sonnet) en toda la prueba.",
    icono: Target,
  },
  {
    valor: "auto",
    label: "Automático",
    titulo:
      "Corre la heurística real de escalado y muestra la razón en el panel de debug.",
    icono: Wand2,
  },
];

/** Igual en estilo a SelectorNivelIA (components/shared), pero con un
 * tercer modo "auto" y estado siempre local — nunca el hook useNivelIA
 * global, porque forzar un modelo en pruebas no debe filtrarse al chat
 * real de Edwin en otras pantallas. */
export function SelectorModoModelo({
  value,
  onChange,
}: {
  value: ModoModelo;
  onChange: (modo: ModoModelo) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-[#141414] p-0.5">
      {OPCIONES.map(({ valor, label, titulo, icono: Icono }) => (
        <button
          key={valor}
          type="button"
          title={titulo}
          onClick={() => onChange(valor)}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
            value === valor
              ? "bg-[#222] text-[#F0F0F0]"
              : "text-[#666] hover:text-[#999]"
          }`}
        >
          <Icono className="size-3" />
          {label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Paso 2: Verificar tipos**

```bash
pnpm exec tsc --noEmit
```

Expected: sin errores. Si `Zap`, `Target` o `Wand2` no existen en `lucide-react`, el
error lo dice explícitamente (`has no exported member`) — buscar el nombre correcto en
`node_modules/lucide-react/dist/lucide-react.d.ts` y ajustar el import.

- [x] **Paso 3: Commit**

```bash
git add components/entrenamiento/SelectorModoModelo.tsx
git commit -m "feat: agrega SelectorModoModelo (Haiku/Sonnet/Automático) para /entrenamiento"
```

**Estado: DONE — commit `5a39497`. Spec ✅. Calidad ✅.**

---

### Task 8: Toggle de RAG — `components/entrenamiento/ToggleRAG.tsx`

**Files:**
- Create: `components/entrenamiento/ToggleRAG.tsx`

- [ ] **Paso 1: Escribir el componente**

```tsx
"use client";

import { Database } from "lucide-react";

/** Botón tipo pill, sin agregar @radix-ui/react-switch como dependencia
 * nueva — mismo lenguaje visual que SelectorModoModelo/SelectorNivelIA. */
export function ToggleRAG({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (activo: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      title="Activa o desactiva la búsqueda en la base de conocimiento (RAG) para esta prueba."
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
        value
          ? "border-brand-lime/40 bg-brand-lime/10 text-brand-lime"
          : "border-border bg-[#141414] text-[#666] hover:text-[#999]"
      }`}
    >
      <Database className="size-3" />
      RAG {value ? "activo" : "inactivo"}
    </button>
  );
}
```

- [ ] **Paso 2: Verificar tipos**

```bash
pnpm exec tsc --noEmit
```

Expected: sin errores.

- [x] **Paso 3: Commit**

```bash
git add components/entrenamiento/ToggleRAG.tsx
git commit -m "feat: agrega ToggleRAG para /entrenamiento"
```

**Estado: DONE — commit `caa6ca6`. Spec ✅. Calidad ✅.**

---

### Task 9: Panel de debug — `components/entrenamiento/PanelDebug.tsx`

**Files:**
- Create: `components/entrenamiento/PanelDebug.tsx`

- [ ] **Paso 1: Escribir el componente**

```tsx
"use client";

import { Download, Clock, Cpu, Coins, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TurnoEntrenamiento } from "@/app/actions/entrenamiento.actions";

export function PanelDebug({ log }: { log: TurnoEntrenamiento[] }) {
  function exportar() {
    const blob = new Blob([JSON.stringify(log, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `entrenamiento-${new Date().toISOString()}.json`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto rounded-[14px] border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-[#F0F0F0]">Panel de debug</h2>
        <Button
          variant="outline"
          size="sm"
          disabled={log.length === 0}
          onClick={exportar}
          className="gap-1.5"
        >
          <Download className="size-3.5" />
          Exportar JSON
        </Button>
      </div>

      {log.length === 0 && (
        <p className="text-[12px] text-[#666]">Todavía no hay turnos en esta prueba.</p>
      )}

      <div className="flex flex-col gap-3">
        {log.map((turno, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-[#141414] p-3 text-[12px]"
          >
            <div className="mb-1.5 flex items-center gap-1.5 text-[#666]">
              <Clock className="size-3" />
              {new Date(turno.timestamp).toLocaleTimeString("es-CO")}
            </div>
            <div className="mb-1 flex items-center gap-1.5 text-[#AAA]">
              <Cpu className="size-3" />
              {turno.modeloUsado} — {turno.razon}
            </div>
            <div className="mb-1 flex items-center gap-1.5 text-[#AAA]">
              <Coins className="size-3" />
              {turno.tokensEntrada} entrada / {turno.tokensSalida} salida
            </div>
            {turno.ragChunks.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[#666]">
                  <BookOpen className="size-3" />
                  Fragmentos RAG recuperados
                </div>
                <div className="flex flex-wrap gap-1">
                  {turno.ragChunks.map((f, j) => (
                    <span
                      key={j}
                      className="rounded-full border border-border bg-[#1A1A1A] px-2 py-0.5 text-[10px] text-[#999]"
                    >
                      {f.seccion} · {Math.round(f.similarity * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Paso 2: Verificar tipos**

```bash
pnpm exec tsc --noEmit
```

Expected: sin errores. Mismo comentario que Task 7 si algún ícono de `lucide-react` no
existe con ese nombre exacto.

- [x] **Paso 3: Commit**

```bash
git add components/entrenamiento/PanelDebug.tsx
git commit -m "feat: agrega PanelDebug (modelo, tokens, chunks RAG) para /entrenamiento"
```

**Estado: DONE — commit `ce10f16`. Spec ✅. Calidad ✅ (nit menor: nombre de archivo exportado con `:` del ISO timestamp, el navegador lo sanea solo).**

---

### Task 10: Editor de prompt — `components/entrenamiento/EditorPromptPanel.tsx`

**Files:**
- Create: `components/entrenamiento/EditorPromptPanel.tsx`

- [ ] **Paso 1: Escribir el componente**

```tsx
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Save, Download } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  actionGuardarPromptActivo,
  actionCargarPromptActivo,
} from "@/app/actions/entrenamiento.actions";
import { SelectorModoModelo, type ModoModelo } from "./SelectorModoModelo";
import { ToggleRAG } from "./ToggleRAG";

export function EditorPromptPanel({
  systemPrompt,
  onChangeSystemPrompt,
  modoModelo,
  onChangeModoModelo,
  useRag,
  onChangeUseRag,
  clienteId,
  onChangeClienteId,
  clientes,
}: {
  systemPrompt: string;
  onChangeSystemPrompt: (valor: string) => void;
  modoModelo: ModoModelo;
  onChangeModoModelo: (modo: ModoModelo) => void;
  useRag: boolean;
  onChangeUseRag: (activo: boolean) => void;
  clienteId: string | null;
  onChangeClienteId: (id: string | null) => void;
  clientes: { id: string; nombre: string }[];
}) {
  const [pending, startTransition] = useTransition();

  function guardar() {
    startTransition(async () => {
      // La tabla solo admite 'basico'/'avanzado' — en modo "Automático" se
      // guarda como 'basico' (el modo automático en sí no es persistible,
      // es una elección de esta pantalla, no del prompt guardado).
      const nivelIa = modoModelo === "auto" ? "basico" : modoModelo;
      const nombre = `Prueba ${format(new Date(), "d MMM yyyy, HH:mm", { locale: es })}`;
      const result = await actionGuardarPromptActivo({
        name: nombre,
        systemPrompt,
        nivelIa,
        useRag,
      });
      if (result.data) {
        toast.success("Prompt guardado como activo.");
      } else {
        toast.error(result.error);
      }
    });
  }

  function cargar() {
    startTransition(async () => {
      const result = await actionCargarPromptActivo();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (!result.data) {
        toast.info("Todavía no hay ningún prompt guardado como activo.");
        return;
      }
      onChangeSystemPrompt(result.data.system_prompt);
      onChangeModoModelo(result.data.nivel_ia);
      onChangeUseRag(result.data.use_rag);
      toast.success("Prompt activo cargado.");
    });
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-[14px] border border-border bg-card p-4">
      <div className="flex flex-1 flex-col">
        <Label htmlFor="system-prompt">System prompt</Label>
        <Textarea
          id="system-prompt"
          value={systemPrompt}
          onChange={(e) => onChangeSystemPrompt(e.target.value)}
          rows={14}
          className="mt-2 flex-1 font-mono text-[13px]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Modelo</Label>
        <SelectorModoModelo value={modoModelo} onChange={onChangeModoModelo} />
      </div>

      <ToggleRAG value={useRag} onChange={onChangeUseRag} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="contexto-cliente">Contexto</Label>
        <Select
          value={clienteId ?? "negocio"}
          onValueChange={(value) =>
            onChangeClienteId(value === "negocio" ? null : (value ?? null))
          }
        >
          <SelectTrigger id="contexto-cliente" className="w-full">
            <SelectValue placeholder="Negocio general" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="negocio">Negocio general</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-auto flex gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-1.5"
          disabled={pending}
          onClick={cargar}
        >
          <Download className="size-3.5" />
          Cargar prompt actual
        </Button>
        <Button className="flex-1 gap-1.5" disabled={pending} onClick={guardar}>
          <Save className="size-3.5" />
          Guardar como activo
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Paso 2: Verificar tipos**

```bash
pnpm exec tsc --noEmit
```

Expected: sin errores.

- [x] **Paso 3: Commit**

```bash
git add components/entrenamiento/EditorPromptPanel.tsx
git commit -m "feat: agrega EditorPromptPanel para /entrenamiento"
```

**Estado: DONE — commit `cc4dcb1` + fix `21d4bc4`. Spec ✅. Code quality review encontró 1 issue "Important" (downgrade silencioso de Automático→Básico al guardar) — corregido con un toast que lo avisa.**

---

### Task 11: Chat simulado — `components/entrenamiento/ChatSimuladoPanel.tsx`

**Files:**
- Create: `components/entrenamiento/ChatSimuladoPanel.tsx`

- [ ] **Paso 1: Escribir el componente**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FlaskConical } from "lucide-react";
import {
  actionEnviarMensajeEntrenamiento,
  type TurnoEntrenamiento,
} from "@/app/actions/entrenamiento.actions";
import type { MensajeConversacion } from "@/lib/claude/chat";
import { BurbujaMensaje } from "@/components/chat/BurbujaMensaje";
import { CampoMensajeChat } from "@/components/chat/CampoMensajeChat";
import { Button } from "@/components/ui/button";
import type { ModoModelo } from "./SelectorModoModelo";

export interface MensajeLocal {
  id: string;
  rol: "user" | "assistant";
  mensaje: string;
  mensajeParaCliente: string | null;
}

export function ChatSimuladoPanel({
  systemPrompt,
  modoModelo,
  useRag,
  clienteId,
  mensajes,
  onMensajesChange,
  onTurno,
  onLimpiar,
}: {
  systemPrompt: string;
  modoModelo: ModoModelo;
  useRag: boolean;
  clienteId: string | null;
  mensajes: MensajeLocal[];
  onMensajesChange: (mensajes: MensajeLocal[]) => void;
  onTurno: (turno: TurnoEntrenamiento) => void;
  onLimpiar: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function enviar(mensaje: string) {
    const historialPrevio: MensajeConversacion[] = mensajes.map((m) => ({
      rol: m.rol,
      mensaje: m.mensaje,
    }));

    const mensajesConUsuario: MensajeLocal[] = [
      ...mensajes,
      { id: `local-${Date.now()}`, rol: "user", mensaje, mensajeParaCliente: null },
    ];
    onMensajesChange(mensajesConUsuario);
    setPending(true);

    const result = await actionEnviarMensajeEntrenamiento(
      { clienteId, mensaje, systemPrompt, modoModelo, useRag },
      historialPrevio
    );
    setPending(false);

    if (result.error || !result.data) {
      toast.error(result.error ?? "No se pudo generar la respuesta.");
      return;
    }

    onMensajesChange([
      ...mensajesConUsuario,
      {
        id: `local-${Date.now()}-r`,
        rol: "assistant",
        mensaje: result.data.texto,
        mensajeParaCliente: result.data.mensajeParaCliente,
      },
    ]);
    onTurno(result.data);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[14px] border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-[#FFDD00]/30 bg-[#FFDD00]/10 px-4 py-2.5">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#FFDD00]">
          <FlaskConical className="size-3.5" />
          MODO ENTRENAMIENTO — esta conversación no se guarda
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onLimpiar}
          disabled={mensajes.length === 0}
        >
          Limpiar conversación
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 md:px-6">
        {mensajes.length === 0 ? (
          <p className="m-auto max-w-xs text-center text-[13px] text-[#666]">
            Escribe un mensaje para empezar a probar el agente.
          </p>
        ) : (
          mensajes.map((m) => (
            <BurbujaMensaje
              key={m.id}
              mensaje={m}
              clienteId={clienteId}
              mensajeParaCliente={m.mensajeParaCliente}
            />
          ))
        )}
        {pending && <p className="text-xs text-[#555]">Pensando...</p>}
      </div>

      <div className="shrink-0 border-t border-border px-4 py-4 md:px-6">
        <CampoMensajeChat
          onEnviar={enviar}
          pending={pending}
          placeholder="Escribe como si fueras el cliente..."
        />
      </div>
    </div>
  );
}
```

- [ ] **Paso 2: Verificar tipos**

```bash
pnpm exec tsc --noEmit
```

Expected: sin errores. `BurbujaMensaje` espera `Pick<MensajeChat, "id"|"rol"|"mensaje">`
— `MensajeLocal` cumple esa forma estructuralmente, no hace falta convertir nada.

- [x] **Paso 3: Commit**

```bash
git add components/entrenamiento/ChatSimuladoPanel.tsx
git commit -m "feat: agrega ChatSimuladoPanel (no persiste en chat_agente) para /entrenamiento"
```

**Estado: DONE — commit `d66c2d4` + fix `6b36b34`. Spec ✅. Code quality review encontró una condición de carrera real (Limpiar durante una respuesta pendiente resucitaba la conversación) — corregida deshabilitando el botón mientras `pending`.**

---

### Task 12: Orquestador — `components/entrenamiento/PaginaEntrenamiento.tsx`

**Files:**
- Create: `components/entrenamiento/PaginaEntrenamiento.tsx`

- [ ] **Paso 1: Escribir el componente**

```tsx
"use client";

import { useState } from "react";
import type { TurnoEntrenamiento } from "@/app/actions/entrenamiento.actions";
import type { AgentConfig } from "@/lib/types";
import { EditorPromptPanel } from "./EditorPromptPanel";
import { ChatSimuladoPanel, type MensajeLocal } from "./ChatSimuladoPanel";
import { PanelDebug } from "./PanelDebug";
import type { ModoModelo } from "./SelectorModoModelo";

export function PaginaEntrenamiento({
  promptActivoInicial,
  clientes,
}: {
  promptActivoInicial: AgentConfig | null;
  clientes: { id: string; nombre: string }[];
}) {
  const [systemPrompt, setSystemPrompt] = useState(
    promptActivoInicial?.system_prompt ?? ""
  );
  const [modoModelo, setModoModelo] = useState<ModoModelo>(
    promptActivoInicial?.nivel_ia ?? "basico"
  );
  const [useRag, setUseRag] = useState(promptActivoInicial?.use_rag ?? true);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<MensajeLocal[]>([]);
  const [debugLog, setDebugLog] = useState<TurnoEntrenamiento[]>([]);

  function limpiar() {
    setMensajes([]);
    setDebugLog([]);
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr_320px]">
      <div className="h-[600px]">
        <EditorPromptPanel
          systemPrompt={systemPrompt}
          onChangeSystemPrompt={setSystemPrompt}
          modoModelo={modoModelo}
          onChangeModoModelo={setModoModelo}
          useRag={useRag}
          onChangeUseRag={setUseRag}
          clienteId={clienteId}
          onChangeClienteId={setClienteId}
          clientes={clientes}
        />
      </div>

      <div className="h-[600px]">
        <ChatSimuladoPanel
          systemPrompt={systemPrompt}
          modoModelo={modoModelo}
          useRag={useRag}
          clienteId={clienteId}
          mensajes={mensajes}
          onMensajesChange={setMensajes}
          onTurno={(turno) => setDebugLog((prev) => [...prev, turno])}
          onLimpiar={limpiar}
        />
      </div>

      <div className="h-[600px]">
        <PanelDebug log={debugLog} />
      </div>
    </div>
  );
}
```

- [ ] **Paso 2: Verificar tipos**

```bash
pnpm exec tsc --noEmit
```

Expected: sin errores.

- [x] **Paso 3: Commit**

```bash
git add components/entrenamiento/PaginaEntrenamiento.tsx
git commit -m "feat: agrega PaginaEntrenamiento (layout de 3 columnas) para /entrenamiento"
```

**Estado: DONE — commit `8d8b564`. Spec ✅. Code quality review ✅ (sin issues bloqueantes; confirma que los fixes previos de ChatSimuladoPanel siguen vigentes).**

---

### Task 13: Ruta — `app/(dashboard)/entrenamiento/page.tsx`

**Files:**
- Create: `app/(dashboard)/entrenamiento/page.tsx`

- [ ] **Paso 1: Escribir la página**

```tsx
import { createClient } from "@/lib/supabase/server";
import { getClientesConEtapa } from "@/lib/data/clientes";
import { actionCargarPromptActivo } from "@/app/actions/entrenamiento.actions";
import { PaginaEntrenamiento } from "@/components/entrenamiento/PaginaEntrenamiento";

export default async function EntrenamientoPage() {
  const supabase = await createClient();
  const [clientes, promptActivo] = await Promise.all([
    getClientesConEtapa(supabase),
    actionCargarPromptActivo(),
  ]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight text-white">
          Entrenamiento
        </h1>
        <p className="mt-0.5 text-[13px] text-[#444]">
          Edita el system prompt del agente y pruébalo en un chat simulado que no se
          guarda.
        </p>
      </div>

      <PaginaEntrenamiento
        promptActivoInicial={promptActivo.data ?? null}
        clientes={clientes.map((c) => ({ id: c.id, nombre: c.nombre }))}
      />
    </div>
  );
}
```

- [ ] **Paso 2: Verificar tipos**

```bash
pnpm exec tsc --noEmit
```

Expected: sin errores.

- [x] **Paso 3: Commit**

```bash
git add "app/(dashboard)/entrenamiento/page.tsx"
git commit -m "feat: agrega la ruta /entrenamiento"
```

**Estado: DONE — commit `cb9a0cd` + fix `667b073`. Spec ✅. Code quality review ✅ (2 nits menores aplicados: comentario aclarando el uso de la Server Action + console.error si falla la carga inicial).**

---

### Task 14: Nav y resolución del choque de nombres con `/conocimiento`

El usuario confirmó: renombrar el ítem de nav existente a "Conocimiento" y agregar
"Entrenamiento" apuntando a la página nueva. También hay que actualizar el heading de
`/conocimiento`, que hoy dice "Entrenamiento del agente" — si no se cambia, Edwin hace
clic en "Conocimiento" en el nav y cae en una página que dice otra cosa.

**Files:**
- Modify: `components/dashboard/SidebarNav.tsx`
- Modify: `app/(dashboard)/conocimiento/page.tsx`

- [ ] **Paso 1: Actualizar el nav**

Buscar:

```tsx
import { LayoutGrid, Users, BarChart3, ListChecks, GraduationCap, MessageCircle } from "lucide-react";

// Los módulos de Cotizaciones y Pedidos siguen existiendo (/cotizaciones,
// /pedidos) pero se ocultaron del menú: Edwin maneja todo el seguimiento
// del cliente (incluida la compra) desde "Registrar seguimiento" en
// /clientes/[id]. No se borró el código ni los datos.
const NAV_ITEMS = [
  { href: "/inicio", label: "Inicio", icon: LayoutGrid },
  { href: "/tareas", label: "Tareas", icon: ListChecks },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/conocimiento", label: "Entrenamiento", icon: GraduationCap },
];
```

Reemplazar por:

```tsx
import {
  LayoutGrid,
  Users,
  BarChart3,
  ListChecks,
  GraduationCap,
  MessageCircle,
  FlaskConical,
} from "lucide-react";

// Los módulos de Cotizaciones y Pedidos siguen existiendo (/cotizaciones,
// /pedidos) pero se ocultaron del menú: Edwin maneja todo el seguimiento
// del cliente (incluida la compra) desde "Registrar seguimiento" en
// /clientes/[id]. No se borró el código ni los datos.
const NAV_ITEMS = [
  { href: "/inicio", label: "Inicio", icon: LayoutGrid },
  { href: "/tareas", label: "Tareas", icon: ListChecks },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/conocimiento", label: "Conocimiento", icon: GraduationCap },
  { href: "/entrenamiento", label: "Entrenamiento", icon: FlaskConical },
];
```

- [ ] **Paso 2: Actualizar el heading de `/conocimiento`**

Buscar:

```tsx
        <h1 className="text-[22px] font-bold tracking-tight text-white">
          Entrenamiento del agente
        </h1>
        <p className="mt-0.5 text-[13px] text-[#444]">
          Edita lo que tu agente sabe del negocio y pruébalo en vivo, a la derecha.
        </p>
```

Reemplazar por:

```tsx
        <h1 className="text-[22px] font-bold tracking-tight text-white">
          Conocimiento del negocio
        </h1>
        <p className="mt-0.5 text-[13px] text-[#444]">
          Edita lo que tu agente sabe del negocio y pruébalo en vivo, a la derecha.
        </p>
```

- [ ] **Paso 3: Verificar tipos**

```bash
pnpm exec tsc --noEmit
```

Expected: sin errores. Si `FlaskConical` no existe en `lucide-react`, buscar un
nombre válido equivalente (ej. `TestTube`) en
`node_modules/lucide-react/dist/lucide-react.d.ts` y ajustar tanto el import de
`SidebarNav.tsx` como el de `ChatSimuladoPanel.tsx` (Task 11) para que coincidan.

- [x] **Paso 4: Commit**

```bash
git add components/dashboard/SidebarNav.tsx "app/(dashboard)/conocimiento/page.tsx"
git commit -m "fix: renombra el nav de /conocimiento a \"Conocimiento\" y agrega \"Entrenamiento\""
```

**Estado: DONE — commit `ad9b5ad`. Spec ✅. Calidad ✅.**

---

### Task 15: Verificación final

**Files:** ninguno (solo verificación)

- [x] **Paso 1: Build completo**

```bash
pnpm build
```

Expected: build exitoso, sin errores de tipos ni de lint bloqueantes.

**Resultado: ✅ `pnpm build` exitoso. `/entrenamiento` aparece en la lista de rutas (`ƒ /entrenamiento`, server-rendered). El error de `LayoutProps` que aparecía en `tsc --noEmit` NO bloquea el build real de Next (es un artefacto de `tsc --noEmit` corrido fuera del pipeline de build, preexistente y no relacionado a este plan).**

- [x] **Paso 2: Lint**

```bash
pnpm lint
```

Expected: sin errores nuevos (pueden existir warnings preexistentes en el resto del
repo — solo revisar que no haya nada nuevo en los archivos tocados por este plan).

**Resultado: ⚠️ 2 problemas preexistentes en archivos NO tocados por este plan (`lib/claude/carga-masiva.ts:110` un `any`, `lib/services/reportes.service.ts:19` un import sin usar) — confirmados preexistentes en `main` antes de este branch. Se corrió `eslint` apuntado solo a los 15 archivos que este plan creó/modificó: ✅ 0 errores, 0 warnings.**

**Revisión final integral del branch completo (main...feature/entrenamiento):** encontró 2 issues "Important" que ninguna revisión por tarea individual podía detectar:
1. `ChatSimuladoPanel` le pasaba el `clienteId` real a `BurbujaMensaje`, activando el botón "Enviar por WhatsApp" — una respuesta de un prompt sin revisar quedaba a un clic de mandarse a un cliente real. **Corregido** (commit `a23c52d`): siempre se le pasa `clienteId={null}` a `BurbujaMensaje` en el chat simulado.
2. El editor arrancaba con el textarea vacío hasta guardar manualmente — sin forma de partir del prompt real de producción. **Corregido** (mismo commit): se exporta `SYSTEM_PROMPT_BASE` (solo lectura, cero cambio de comportamiento en producción) y se usa como valor inicial cuando no hay ningún prompt guardado.
Ambos fixes re-verificados: `tsc --noEmit` y `eslint` limpios, `chat.actions.ts` (producción) sin diff, build exitoso.

- [x] **Paso 1 (smoke test automatizado, no reemplaza la prueba manual del Paso 3):** `pnpm build` + `pnpm dev` en el worktree (con `.env.local` copiado desde el checkout principal), confirmado que `/entrenamiento` y `/conocimiento` responden `307` → `/login` sin sesión (sin crashear el servidor) y `/login` responde `200`.

- [ ] **Paso 3: Prueba manual en el navegador**

```bash
pnpm dev
```

Con el server corriendo, y sesión iniciada como Edwin:

1. Ir a `/conocimiento` — confirmar que el nav muestra "Conocimiento" resaltado y el
   heading dice "Conocimiento del negocio".
2. Ir a `/entrenamiento` — confirmar que el nav muestra "Entrenamiento" resaltado.
3. Escribir un mensaje en el chat simulado con "Negocio general" seleccionado y modo
   "Automático" — confirmar que aparece una respuesta y que el panel de debug muestra
   modelo, razón, tokens.
4. Cambiar el contexto a un cliente real de la lista y mandar otro mensaje — confirmar
   que la respuesta usa datos de ese cliente (ej. si le preguntás "¿qué le hemos
   cotizado?").
5. Forzar el modo a "Sonnet" y mandar un mensaje corto — confirmar que el panel de
   debug muestra "Forzado manualmente a Sonnet." como razón, no la heurística.
6. Apagar el toggle de RAG y mandar un mensaje — confirmar que la sección de
   "Fragmentos RAG recuperados" no aparece para ese turno.
7. Click en "Exportar JSON" — confirmar que descarga un archivo con el log completo.
8. Click en "Limpiar conversación" — confirmar que el chat y el debug log quedan
   vacíos.
9. Escribir el system prompt y click en "Guardar como activo" — confirmar el toast de
   éxito. Recargar la página y click en "Cargar prompt actual" — confirmar que el
   textarea vuelve a tener exactamente ese texto.
10. En Supabase (Table Editor), abrir `chat_agente` y confirmar que **no** hay filas
    nuevas con timestamps de esta sesión de prueba (los mensajes reales de
    `/clientes/[id]` sí deben seguir apareciendo si se prueban aparte).

- [ ] **Paso 4: Commit final si hubo ajustes**

Si el Paso 3 encontró algo para corregir, arreglarlo, repetir Pasos 1-3, y commitear:

```bash
git add -A
git commit -m "fix: ajustes de verificación manual en /entrenamiento"
```

---

## Fuera de alcance (recordatorio, ver spec)

- Probar `sugerirRespuestaWhatsapp` (el generador de respuestas de WhatsApp).
- UI para navegar el historial de prompts guardados en `agent_config`.
- Que "Guardar como activo" cambie el comportamiento del chat real sin deploy.
