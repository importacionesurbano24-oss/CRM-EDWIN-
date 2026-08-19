# /entrenamiento — sandbox de prueba del agente interno

## Contexto y objetivo

Edwin necesita un lugar interno (no visible para clientes) donde pueda:

1. Editar el system prompt del chat interno (`lib/claude/chat.ts`) y probarlo antes de
   ponerlo en producción.
2. Simular una conversación con el agente usando exactamente la misma lógica que el
   chat real (`PanelChat` / `responderChat`), sin que nada de esa conversación se
   guarde en la tabla `chat_agente`.
3. Ver un panel de debug por turno: modelo usado (Haiku/Sonnet), razón del modelo
   (heurística automática o forzado manual), tokens de entrada/salida, y qué
   fragmentos de la base de conocimiento (RAG) se recuperaron.

**Qué agente se prueba:** el chat interno de asesor (`lib/claude/chat.ts`,
`responderChat`), el mismo que usa `PanelChat` en `/clientes/[id]` y el dashboard hoy.
Es el único agente del proyecto que hoy tiene una interfaz de chat real — el generador
de respuestas de WhatsApp (`sugerirRespuestaWhatsapp`) es un botón de un solo turno,
sin UI de chat, y queda fuera de esta primera versión.

## Decisiones de diseño (confirmadas con el usuario)

- **"Guardar como activo" no toca producción.** El prompt guardado en `agent_config`
  queda como referencia; el chat real sigue usando la constante `SYSTEM_PROMPT_BASE`
  hardcodeada en `chat.ts` hasta que alguien copie el texto ganador ahí a mano. Cero
  riesgo de que una prueba mala afecte el chat real de Edwin. Consistente con que hoy
  el prompt es "constante, no variable de entorno" en los tres archivos del agente
  (`agente.ts`, `chat.ts`, `whatsapp.ts`).
- **Contexto simulado configurable:** negocio general (agregado, `clienteId: null`,
  igual al chat general de hoy) o un cliente real específico (carga su
  historial/cotizaciones/pedidos reales), elegible desde el panel de configuración.
- **Selector de modelo con tres modos:** Haiku fijo / Sonnet fijo / Automático. El modo
  automático corre `decidirNivelIA` de verdad y el panel de debug muestra la razón por
  la que escaló (o no) a Sonnet — eso es lo único que le da sentido a mostrar "razón
  del cambio" como pide el pedido original.
- **API:** Server Action, no API route. El CLAUDE.md de este proyecto prohíbe
  explícitamente API routes para lógica de negocio (solo el webhook de WhatsApp la
  necesita, por ser pública).

## Esquema de base de datos

Nueva migración `supabase/migrations/0008_agent_config.sql`:

```sql
create table public.agent_config (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  system_prompt text not null,
  nivel_ia text not null default 'basico' check (nivel_ia in ('basico','avanzado')),
  use_rag boolean not null default true,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index agent_config_una_activa_idx on public.agent_config (user_id) where is_active;

alter table public.agent_config enable row level security;

create policy "agent_config select propio"
  on public.agent_config for select
  using (user_id = auth.uid());

create policy "agent_config insert propio"
  on public.agent_config for insert
  with check (user_id = auth.uid());

create policy "agent_config update propio"
  on public.agent_config for update
  using (user_id = auth.uid());
```

Notas:

- `nivel_ia` usa los mismos valores (`'basico'/'avanzado'`) que el tipo `NivelIA` ya
  usado en todo el proyecto — no una segunda nomenclatura tipo `'haiku'/'sonnet'`.
- El índice único parcial (`where is_active`) garantiza a nivel de base de datos que
  solo puede haber una fila activa por usuario — no depende de que la app lo respete.
- "Guardar como activo" **inserta una fila nueva** (desactivando la anterior primero
  dentro de la misma Server Action), no hace update in-place. Efecto secundario
  gratis: queda un historial de prompts probados en la tabla, aunque esta versión no
  construye UI para navegarlo.

## Cambios en lógica existente (reutilizar, no duplicar)

### `lib/claude/chat.ts`

`responderChat` gana un parámetro opcional:

```ts
export async function responderChat(
  historial: MensajeConversacion[],
  contextoEspecifico: string,
  fragmentos: FragmentoConocimiento[],
  nivel?: NivelIA,
  opciones?: { systemPromptOverride?: string }
): Promise<RespuestaChat>
```

- Si `opciones.systemPromptOverride` no viene, se usa `SYSTEM_PROMPT_BASE` tal cual —
  el chat real no cambia de comportamiento.
- `RespuestaChat` gana campos nuevos, siempre poblados desde `response.usage` del SDK
  de Anthropic (el caller real los ignora, no rompe nada):

```ts
export interface RespuestaChat {
  texto: string;
  mensajeParaCliente: string | null;
  modeloUsado: string;       // ej. "claude-haiku-4-5"
  nivelResuelto: NivelIA;
  tokensEntrada: number;
  tokensSalida: number;
}
```

### `lib/claude/modelos.ts`

Nueva función `explicarNivelIA(mensaje: string): { nivel: NivelIA; razon: string }`,
refactorizando el array de patrones de objeción a una constante compartida (ambas
funciones lo usan, no hay dos copias del mismo regex). `decidirNivelIA` puede pasar a
ser `explicarNivelIA(mensaje).nivel` para garantizar que nunca diverjan.

## Server Actions nuevas: `app/actions/entrenamiento.actions.ts`

- **`actionEnviarMensajeEntrenamiento(input)`**
  - Input: `{ mensaje, historialPrevio, systemPrompt, modoModelo: NivelIA | "auto", useRag, clienteId }`
  - Arma `contextoEspecifico` con `construirContextoCliente`/`construirContextoNegocio`
    (las mismas funciones que usa `chat.actions.ts`, importadas, no reescritas).
  - Si `useRag`, llama `buscarConocimientoRelevante`; si no, `fragmentos = []`.
  - Si `modoModelo === "auto"`, pasa `nivel: undefined` a `responderChat` (deja que la
    heurística real decida) y calcula la razón con `explicarNivelIA(mensaje)` para el
    debug panel. Si es fijo, pasa ese nivel y la razón es `"Forzado manualmente a
    {modelo}"`.
  - Llama `responderChat(..., { systemPromptOverride: systemPrompt })`.
  - **No inserta en `chat_agente`. No llama `revalidatePath`.**
  - Devuelve `{ texto, mensajeParaCliente, modeloUsado, nivelResuelto, razon, tokensEntrada, tokensSalida, ragChunks, timestamp }`.
- **`actionGuardarPromptActivo(input)`** — desactiva la fila activa anterior (si hay) e
  inserta una fila nueva activa en `agent_config`.
- **`actionCargarPromptActivo()`** — trae la fila activa actual (o `null`).

La lista de clientes para el selector de contexto se resuelve server-side en
`page.tsx` con `getClientesConEtapa` (ya existe, la usa `chat.actions.ts`) y se pasa
como prop — no hace falta una Server Action nueva solo para listar.

## Ruta y protección

`app/(dashboard)/entrenamiento/page.tsx` — Server Component dentro del mismo grupo
`(dashboard)` que ya protege `proxy.ts` (requiere sesión). PasoCRM es de un solo
usuario (Edwin); no existe ni se construye un rol "admin" separado — heredar la
protección de sesión existente es suficiente. Se agrega una entrada al sidebar
existente.

## UI — `components/entrenamiento/`

Layout de 3 columnas (`grid-cols-[320px_1fr_320px]` en desktop; apiladas con
secciones colapsables — `<details>`, sin dependencias nuevas — en pantallas chicas):

- **`EditorPromptPanel`** (client)
  - `Textarea` para el system prompt (componente shadcn ya existente).
  - Selector de 3 vías Haiku / Sonnet / Automático — mismo lenguaje visual que
    `SelectorNivelIA`, pero **estado local al componente**, no el hook `useNivelIA`
    (ese persiste en `localStorage` y es compartido por todo el CRM — forzar un
    modelo en pruebas no debe filtrarse al chat real de Edwin en otras pantallas).
  - Toggle de RAG — botón tipo pill (mismo patrón visual que el selector de nivel),
    sin agregar `@radix-ui/react-switch` como dependencia nueva.
  - Selector de contexto: "Negocio general" o un `Select` de cliente (mismo patrón
    que `NuevaCotizacionDialog`).
  - Botones "Guardar como activo" y "Cargar prompt actual", con toast (`sonner`) de
    confirmación/error, igual que el resto del CRM.
- **`ChatSimuladoPanel`** (client)
  - Banner fijo: "🧪 MODO ENTRENAMIENTO — esta conversación no se guarda".
  - Reutiliza `BurbujaMensaje` y `CampoMensajeChat` para verse idéntico al chat real
    (mensajes locales construidos igual que el patrón "optimista" que ya usa
    `PanelChat`, con ids sintéticos).
  - Botón "Limpiar conversación" — resetea el estado local (mensajes + debug log).
- **`PanelDebug`** (client)
  - Por turno: hora, modelo usado + razón, tokens entrada/salida, chips de los
    fragmentos RAG recuperados (sección + % de similitud).
  - Botón "Exportar como JSON" — arma el blob del log en el cliente y dispara la
    descarga, sin round-trip al servidor.

`PaginaEntrenamiento` (client, top-level) sostiene el estado compartido entre los tres
paneles: `systemPrompt`, `modoModelo`, `useRag`, `contexto` (negocio o clienteId),
`mensajes`, `debugLog`.

## Fuera de alcance de esta versión

- Probar el generador de respuestas de WhatsApp (`sugerirRespuestaWhatsapp`) — solo el
  chat interno.
- UI para navegar el historial de prompts guardados en `agent_config` (las filas
  quedan en la tabla, pero solo se expone la activa).
- Que "Guardar como activo" cambie el comportamiento del chat real sin deploy.

## Verificación

No hay test runner en el proyecto (`package.json` solo tiene `dev`/`build`/`start`/
`lint`). Verificación manual:

1. `pnpm dev`, entrar autenticado a `/entrenamiento`.
2. Probar una conversación simulada (con y sin cliente específico, con y sin RAG, en
   los tres modos de modelo) y confirmar que el panel de debug muestra datos
   coherentes (modelo, razón, tokens, chunks).
3. Confirmar en Supabase que no se insertaron filas nuevas en `chat_agente` durante la
   prueba.
4. Guardar un prompt como activo, recargar la página, confirmar que "Cargar prompt
   actual" trae exactamente lo guardado.
5. `pnpm build` y `pnpm lint` sin errores nuevos.
