# Modo enfoque — flujo secuencial de tareas diarias

## Contexto

Edwin quiere que el CRM lo "obligue" a resolver sus tareas del día una por
una, sin poder saltar a otras cosas en el medio y perder el hilo. Hoy
`/tareas` ya calcula todo lo necesario (Briefing del día + "Hoy toca") pero
lo muestra como dos listas — Edwin puede ignorarlas y navegar libremente a
cualquier otra parte del CRM sin resistencia.

Se definió con Edwin, en orden:
- **No es un bloqueo real del CRM** — es un modo opcional que se activa con
  un botón ("Empezar mi día"); el resto del sistema queda igual de libre
  si no lo usa. Tiene su propia salida explícita ("Salir del modo
  enfoque"), visible en cada paso, no solo al terminar.
- **La cola combina ambas fuentes** (Briefing + Hoy toca) en un solo orden,
  ordenado por una **prioridad explícita**, no por el orden en que llegan
  los datos.
- **Los items del Briefing se resuelven inline** (ya tienen Ejecutar/
  Ignorar hoy).
- **Los items de "Hoy toca" se resuelven yendo a la ficha del cliente**
  (reutiliza todo lo que ya existe ahí — formulario, chat, WhatsApp), con
  un banner para volver al flujo. **Entrar a la ficha nunca marca la tarea
  como resuelta por sí solo** — solo se resuelve cuando de verdad se
  registra un seguimiento vía `RegistrarSeguimientoForm` (el formulario
  existente, sin tocar). También hay un "Posponer para mañana" directo en
  la tarjeta, para quien no quiera entrar a la ficha en ese momento.

**Objetivo:** que terminar la cola se sienta como recorrer una lista clara
de principio a fin, con una noción honesta de qué está realmente resuelto,
sin duplicar la lógica de negocio que ya existe en `briefing.service.ts`,
`ListaTareasHoy` ni `RegistrarSeguimientoForm`.

---

## Arquitectura

Sin tabla ni columna nueva en Supabase. Sin librería de estado nueva
(nada de Zustand/Redux) — la posición en la cola viaja en la URL, mismo
patrón que ya usa `/whatsapp?cliente=`.

### `EnfoqueItem` — abstracción única para cualquier fuente

```ts
export type TipoEnfoqueItem = "briefing" | "hoy_toca"; // futuras fuentes se agregan acá

export interface EnfoqueItem {
  /** Id estable y único del item — NO es solo el clienteId, evita que dos
   * acciones distintas del mismo cliente se pisen en `vistos`. */
  taskKey: string; // `briefing:${clienteId}:${regla}` | `hoy_toca:${clienteId}`
  tipo: TipoEnfoqueItem;
  clienteId: string;
  clienteNombre: string;
  /** Menor = más urgente. Ver tabla de prioridad más abajo. */
  prioridad: number;
  // Payload específico por tipo — solo uno de los dos viene lleno:
  alerta?: AlertaBriefing;       // si tipo === "briefing"
  cliente?: ClienteConEtapa;     // si tipo === "hoy_toca"
}
```

`lib/services/enfoque.service.ts` expone
`construirColaEnfoque(clientes, alertasBriefing, tareasHoy, vistos: Set<string>): EnfoqueItem[]`
— combina las dos fuentes en `EnfoqueItem[]`, deduplica (ver abajo), ordena
por `prioridad`, y filtra los `taskKey` presentes en `vistos`. Es una
función pura, mismo estilo que `generarAlertasBriefing`.

### Prioridad explícita (unifica ambas fuentes)

No se asume "todo el Briefing antes que todo Hoy toca" — se intercala por
urgencia real. Extiende la tabla de prioridad que ya existe en
`briefing.service.ts` insertando los dos casos de "Hoy toca":

| # | Origen | Caso |
|---|---|---|
| 0 | Briefing | `whatsapp_sin_responder` |
| 1 | Hoy toca | vencido (`proxima_accion_fecha` en el pasado) |
| 2 | Briefing | `compro_posventa` |
| 3 | Briefing | `posventa_referido` |
| 4 | Hoy toca | fecha es hoy exactamente |
| 5 | Briefing | `cotizo_frio` |
| 6 | Briefing | `cotizo_seguimiento` |
| 7 | Briefing | `sin_accion` |

Dentro del mismo número de prioridad, se ordena igual que hoy
(`briefing.service.ts` ya desempata por `dias` descendente). Este orden es
una propuesta razonable, no una verdad absoluta — fácil de ajustar en un
solo lugar (`enfoque.service.ts`) si en la práctica no se siente bien.

### Deduplicación (paso explícito sobre `EnfoqueItem[]`)

Un cliente puede calificar para el Briefing y para "Hoy toca" el mismo
día. Regla: si un `clienteId` ya generó un item `briefing`, se descarta su
item `hoy_toca` — es la misma oportunidad de contacto vista por dos
reglas distintas, no dos tareas separadas. Esto pasa **después** de armar
ambas listas de `EnfoqueItem`, comparando `clienteId`, no al construir las
listas por separado como en la versión anterior de este diseño.

### Qué significa `vistos` (y qué NO significa)

`vistos` es un `Set<taskKey>` que viaja en la URL, separado por comas. Su
**único** propósito es soportar "Ignorar" en el Briefing — esa acción no
persiste nada en la base de datos (es así hoy, a propósito: la alerta debe
seguir apareciendo mañana si de verdad no se resolvió), así que sin
`vistos` el mismo item reaparecería en el siguiente paso en un loop.

`vistos` **no** se usa para marcar tareas de "Hoy toca" como resueltas.
Esas se resuelven exclusivamente porque `construirColaEnfoque` se
recalcula en vivo en cada paso con los datos reales de Supabase — si
Edwin registró un seguimiento que cambió `proxima_accion_fecha`, ese
cliente deja de calificar la próxima vez que se arma la cola, sin
intervención manual. Entrar a la ficha y volver sin haber guardado nada
dejará que la misma tarea vuelva a aparecer — es el comportamiento
correcto, no un bug.

`total` (tamaño de la cola al entrar) viaja en la URL solo para mostrar
progreso — **nunca se usa para decidir qué mostrar ni para filtrar**. El
contador visible ("Tarea N de M") se calcula como
`total - colaActual.length` en cada render, nunca al revés.

```
/enfoque                                         → primer paso, sin vistos
/enfoque?vistos=briefing:id1:cotizo_frio&total=6 → siguiente item pendiente
/clientes/abc?volver=enfoque&vistos=...&total=6  → banner de vuelta
```

---

## Componentes

| Archivo | Qué hace | Nuevo/Existente |
|---|---|---|
| `app/(dashboard)/enfoque/page.tsx` | Server Component. Arma la cola con `construirColaEnfoque`, muestra el primer item, la pantalla de fin, o el link "Salir del modo enfoque" | **Nuevo** |
| `lib/services/enfoque.service.ts` | `EnfoqueItem`, `construirColaEnfoque(...)` — combina, deduplica, prioriza, filtra por `vistos`. Función pura | **Nuevo** |
| `components/enfoque/ItemBriefingEnfoque.tsx` | Una alerta de Briefing — Ejecutar (reusa `actionEjecutarAlertaBriefing`) o Ignorar (agrega su `taskKey` a `vistos`) | **Nuevo** |
| `components/enfoque/ItemHoyTocaEnfoque.tsx` | Una tarjeta de "Hoy toca" — "Ir a la ficha →" (no toca `vistos`) y "Posponer para mañana" (`actionPosponerTarea`, sí resuelve de verdad) | **Nuevo** |
| `app/actions/enfoque.actions.ts` | `actionPosponerTarea(clienteId, etapaActual)` — inserta un seguimiento con `proxima_accion_fecha` = mañana, misma etapa, nota "Pospuesto desde el modo enfoque." | **Nuevo** |
| `components/pipeline/BannerModoEnfoque.tsx` | Banner fijo en la ficha del cliente cuando se llegó con `?volver=enfoque` — link "Volver al modo enfoque" (no dice "Siguiente tarea": puede repetir la misma si no se resolvió) | **Nuevo** |
| `app/(dashboard)/clientes/[id]/page.tsx` | Lee `volver`/`vistos`/`total` de `searchParams` y renderiza el banner si corresponde | Existente, se extiende |
| `app/(dashboard)/tareas/page.tsx` | Botón "Empezar mi día →" que lleva a `/enfoque` | Existente, se extiende |

Se reutiliza sin cambios: `getClientesConEtapa`, `generarAlertasBriefing`,
`esPendienteHoy`, `getUltimosMensajesPorCliente`,
`actionEjecutarAlertaBriefing`, `textoPlantilla`, `ETAPA_META`,
`RegistrarSeguimientoForm` (sin tocar — sigue siendo el único lugar donde
se resuelve de verdad un "Hoy toca").

---

## Pantalla de fin y salida

- Cola vacía (todo resuelto o ignorado): pantalla "Terminaste tus tareas
  de hoy 🎉" con link a `/dashboard`. Mismo mensaje si entra sin ninguna
  tarea pendiente desde el inicio.
- **"Salir del modo enfoque"**: link visible en el header de `/enfoque` en
  todo momento (no solo al terminar), vuelve a `/tareas` sin marcar nada
  como resuelto ni ignorado — las tareas no vistas siguen intactas para la
  próxima vez.

---

## Fuera de alcance (explícitamente)

- No se bloquea el resto del CRM — es enteramente opcional entrar.
- No se persiste el "Ignorar" del Briefing más allá de la sesión de
  enfoque actual (comportamiento ya existente, sin cambios).
- No se agrega tabla ni columna nueva en Supabase.
- No se toca `RegistrarSeguimientoForm` ni la ficha del cliente más allá
  del banner.
- No se decompone la sesión de enfoque en el servidor (nada de tabla
  `sesiones_enfoque`) — todo el estado de progreso vive en la URL, se
  pierde si Edwin cierra la pestaña, y eso es aceptable.
- No se agrega ninguna fuente nueva de tareas más allá de Briefing y "Hoy
  toca" — `EnfoqueItem`/`TipoEnfoqueItem` quedan preparados para eso, pero
  no se construye nada adicional ahora.

---

## Verificación

- `npx tsc --noEmit` limpio.
- Con 0 tareas pendientes: `/enfoque` muestra la pantalla de fin
  directamente.
- Cliente que califica para Briefing y para "Hoy toca" a la vez: aparece
  una sola vez (como item `briefing`) en la cola.
- Orden de la cola respeta la tabla de prioridad, no el orden de llegada
  de los datos (ej. un "Hoy toca" vencido debe aparecer antes que un
  `sin_accion` del Briefing aunque este último venga primero en el array).
- Resolver una alerta de Briefing con "Ejecutar" → avanza, no reaparece.
- "Ignorar" una alerta → avanza; si Edwin sale y vuelve a entrar a
  `/enfoque` desde cero (sin `vistos` en la URL) esa misma alerta
  reaparece — esperado.
- Click en "Ir a la ficha →", salir sin guardar nada, volver con "Volver
  al modo enfoque" → **la misma tarea de "Hoy toca" debe reaparecer**, no
  debe darse por resuelta.
- Click en "Ir a la ficha →", registrar un seguimiento real con nueva
  `proxima_accion_fecha`, volver → esa tarea ya no aparece.
- "Posponer para mañana" → crea el seguimiento correcto y el cliente sale
  de la cola de esta sesión.
- "Salir del modo enfoque" en cualquier paso → vuelve a `/tareas` sin
  alterar el estado de ninguna tarea no vista.
- Terminar toda la cola → pantalla de fin.
