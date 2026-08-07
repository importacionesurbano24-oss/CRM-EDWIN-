# Chat con IA: ficha de cliente + Inicio — Diseño

## Contexto

PasoCRM ya tiene varias piezas de IA puntuales (Sugerir próxima acción,
Briefing del día, Mensaje desde la lista) que devuelven un resultado fijo
por cada clic. Edwin quiere algo más flexible: poder **preguntarle** a la
IA en lenguaje natural, en dos lugares distintos:

1. Dentro de la ficha de un cliente — preguntas sobre ESE cliente
   ("¿qué le digo?", "¿cuánto lleva sin responder?", "hazme un mensaje de
   cierre").
2. En Inicio (`/dashboard`) — preguntas generales del negocio ("¿cuántos
   leads tengo esta semana?", "¿quién lleva más tiempo sin responder?",
   "¿qué garantía tiene el colchón ortopédico?").

Motivación: los botones actuales (Sugerir, Mensaje) solo cubren un caso de
uso fijo cada uno. Un chat cubre cualquier pregunta sin tener que anticipar
cada botón, y con historial persistente se vuelve una bitácora de
conversación con la IA sobre cada cliente y sobre el negocio en general.

## Decisiones ya confirmadas con el usuario

- **Server Action, no API route.** CLAUDE.md prohíbe API routes para
  lógica de negocio salvo el futuro webhook de WhatsApp. Se usa el mismo
  patrón que ya tienen `agente.actions.ts` y `briefing.actions.ts`.
- **Sin streaming.** La respuesta se espera completa (1-3s), igual que el
  resto de las funciones de IA de la app. Streaming real requeriría una
  librería nueva o un API route hecho a mano — no se justifica para
  respuestas cortas de un chat de un solo usuario.
- **Modelo:** `claude-sonnet-5` (el usuario pidió `claude-sonnet-4-6`, que
  no existe — se usa el modelo ya establecido en CLAUDE.md y en el resto
  del código).
- **Info del negocio (catálogo/garantías/objeciones):** no existe hoy en
  ningún lado. Se agrega una tabla `info_negocio` de una sola fila por
  usuario, con un textarea de edición en una pantalla nueva
  `/configuracion`, cuyo contenido se inyecta tal cual en el system
  prompt. Sin RAG ni vectores — el volumen no lo justifica.
- **`SugerenciaAgente.tsx` se reemplaza** por el chat de cliente, con un
  botón "Sugerir próxima acción" que envía ese mensaje al chat
  automáticamente. **`agente.actions.ts` / `lib/claude/agente.ts` NO se
  borran** — `BotonMensajeIA.tsx` (acción "Mensaje" en la tabla Lista de
  clientes, etapa "Cotizó") sigue usándolos.
- **Historial del chat general: un solo hilo continuo**, sin botón de
  "nueva conversación" — se acumula como el chat de un celular.
- El menú lateral ya se renombró "Dashboard" → "Inicio" (hecho, fuera de
  este spec).

## Arquitectura

```
ChatAgente.tsx (ficha cliente)  ──┐
                                    ├──> actionEnviarMensajeChat(clienteId | null, mensaje)
ChatNegocio.tsx (Inicio)        ──┘         │
                                             ├─ inserta mensaje "user" en chat_agente
                                             ├─ arma contexto (cliente o negocio)
                                             ├─ llama a Claude (lib/claude/chat.ts)
                                             ├─ inserta respuesta "assistant" en chat_agente
                                             └─ devuelve { data: mensajeAsistente, error }
```

Ambos componentes son "use client", reciben el historial inicial ya
cargado por el Server Component padre (sin loading flash), y llaman la
Server Action con `useTransition`, igual que el resto de los formularios
de la app.

## Modelo de datos

### Tabla `chat_agente`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid pk | `gen_random_uuid()` |
| `user_id` | uuid | `default auth.uid()`, RLS igual que el resto de tablas |
| `cliente_id` | uuid null | FK a `clientes.id` on delete cascade. `null` = mensaje del chat general |
| `rol` | text | check `in ('user','assistant')` — coincide literal con los roles que espera la API de Claude, sin capa de traducción |
| `mensaje` | text | contenido |
| `created_at` | timestamptz | `default now()` |

Índices: `user_id`, `(cliente_id, created_at)`. RLS: mismas 4 policies
(`select/insert/update/delete ... using (auth.uid() = user_id)`) que ya
usan `clientes`/`seguimientos`/`cotizaciones`/`pedidos`.

### Tabla `info_negocio`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid | único por usuario (`unique`), RLS igual que el resto |
| `contenido` | text | catálogo/garantías/objeciones en texto libre, editable |
| `updated_at` | timestamptz | se actualiza en cada guardado |

## Contexto que arma cada chat

- **Cliente:** se reutiliza la lógica que ya arma
  `lib/claude/agente.ts` (`ContextoCliente`/`formatearContexto`) para
  "Sugerir" — mismo cliente, etapa, historial, cotizaciones, pedidos,
  link de cotización externa. No se duplica.
- **Negocio:** se reutilizan `lib/services/reportes.service.ts`
  (conteos por etapa/origen, nuevos en el período, ventas del mes vía
  pedidos) y `lib/services/briefing.service.ts`
  (`generarAlertasBriefing`, para "quién lleva más tiempo sin
  responder"). Ya se calculan hoy para Reportes y el Briefing del día —
  se formatean como texto para el prompt, no hay cálculos nuevos.
- Ambos contextos se concatenan con el contenido de `info_negocio` y el
  bloque base del prompt (tono Dormiluna, neuroventas suave, nunca
  inventar precios/datos que no estén en el contexto).

`lib/claude/chat.ts` expone `responderChat(mensajes, contextoTexto):
Promise<string>` — construye `system = SYSTEM_PROMPT_BASE + contextoTexto`,
pasa el historial de la conversación (mapeado a roles de Anthropic) como
`messages`, llama `claude-sonnet-5` sin `output_config`/schema (texto
libre, no hay salida estructurada aquí), devuelve el texto.

## Componentes

- `components/chat/BurbujaMensaje.tsx` — una burbuja (usuario a la
  derecha, asistente a la izquierda), compartida por ambos chats.
- `components/chat/CampoMensajeChat.tsx` — input + botón enviar,
  compartido.
- `components/pipeline/ChatAgente.tsx` — reemplaza a `SugerenciaAgente.tsx`
  en `app/(dashboard)/clientes/[id]/page.tsx`. Props: `clienteId`,
  `clienteNombre`, `historialInicial`. Botón "Sugerir próxima acción"
  arriba del campo de texto, que precarga y envía un mensaje fijo
  ("¿Qué debería hacer ahora con este cliente?").
- `components/dashboard/ChatNegocio.tsx` — sección fija (no popup) en
  `/dashboard`, debajo de los KPIs. Props: `historialInicial` (últimos
  50 mensajes, para no cargar un hilo infinito).
- `app/(dashboard)/configuracion/page.tsx` — página nueva, un textarea
  con el contenido de `info_negocio` y un botón guardar
  (`actionGuardarInfoNegocio`). Se agrega al menú lateral.

## Prompt base (Dormiluna)

Mismo tono que ya usa `agente.ts`, reutilizable como bloque común:
vendemos colchones/bases cama/almohadas, tono cercano tuteando, técnicas
de neuroventas y urgencia suave sin presionar, nunca inventar precios ni
datos que no estén en el contexto entregado (cliente o negocio), y para
preguntas de catálogo/garantías usa únicamente lo que haya en
`info_negocio` — si no está, decirlo honestamente en vez de inventar.

## Manejo de errores

Mismo patrón `ActionResult<T>` que el resto de las Server Actions:
si Claude falla (sin `ANTHROPIC_API_KEY`, error de red, etc.) se
devuelve `{ data: null, error: mensaje }`, el mensaje del usuario ya
insertado en `chat_agente` queda igual (no se pierde), y el componente
muestra un toast de error sin agregar una burbuja de respuesta falsa.

## Verificación

- `pnpm lint` y `pnpm build` limpios.
- Migración aplicada al proyecto real de Supabase (mismo flujo que las
  migraciones anteriores de esta sesión, vía `supabase db push`).
- Smoke test manual: abrir una ficha de cliente, escribir una pregunta,
  confirmar que aparece la respuesta y que sigue ahí al recargar la
  página; lo mismo en Inicio con el chat general; guardar texto en
  `/configuracion` y confirmar que una pregunta de catálogo lo usa.
