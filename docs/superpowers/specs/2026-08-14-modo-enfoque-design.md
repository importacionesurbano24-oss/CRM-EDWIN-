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
  si no lo usa.
- **La cola combina ambas fuentes** (Briefing + Hoy toca) en un solo orden,
  no dos flujos separados.
- **Los items del Briefing se resuelven inline** (ya tienen Ejecutar/
  Ignorar hoy).
- **Los items de "Hoy toca" se resuelven yendo a la ficha del cliente**
  (reutiliza todo lo que ya existe ahí — formulario, chat, WhatsApp), con
  un banner para volver al flujo al terminar. También hay un "Posponer
  para mañana" directo en la tarjeta, para quien no quiera entrar a la
  ficha en ese momento.

**Objetivo:** que terminar la cola se sienta como recorrer una lista clara
de principio a fin, sin duplicar la lógica de negocio que ya existe en
`briefing.service.ts`, `ListaTareasHoy` ni `RegistrarSeguimientoForm`.

---

## Arquitectura

Sin tabla ni columna nueva en Supabase. Sin librería de estado nueva
(nada de Zustand/Redux) — la posición en la cola viaja en la URL, mismo
patrón que ya usa `/whatsapp?cliente=`.

### Cómo se arma y se avanza la cola (la parte no obvia)

La cola **no se congela** al entrar — se recalcula fresca en cada paso con
las mismas funciones que ya usa `/tareas` (`getClientesConEtapa`,
`generarAlertasBriefing`, `esPendienteHoy`). Esto es deliberado: cuando
Edwin resuelve un item (ej. registra un seguimiento que cambia
`proxima_accion_fecha`), ese cliente dejará de calificar para la cola de
forma natural la próxima vez que se recalcule — no hay que llevar un
índice numérico que se desincronice cuando la lista subyacente cambia de
tamaño entre pasos.

El único estado que viaja en la URL es `vistos` (lista de `clienteId`
separados por coma) — los que ya se resolvieron **o ignoraron** en esta
sesión de enfoque. Hace falta explícitamente para el caso de "Ignorar" en
el Briefing: esa acción no persiste nada (es así hoy, a propósito — la
alerta debe seguir apareciendo mañana si de verdad no se resolvió), así
que sin `vistos` el mismo item volvería a aparecer en el siguiente paso en
un loop infinito, sin dejar avanzar la sesión de hoy. Con `vistos`, cada
paso muestra: *el primer item de la cola recalculada cuyo `clienteId` no
esté en `vistos`*.

`total` (el tamaño de la cola al entrar) también viaja en la URL, solo
para el contador "Tarea N de M" — no afecta la lógica de avance.

```
/enfoque                                    → primer paso, sin vistos
/enfoque?vistos=id1,id2&total=6             → tercer item pendiente
/clientes/abc?volver=enfoque&vistos=id1,id2&total=6   → banner de vuelta
```

### Deduplicación

Un cliente puede calificar para el Briefing (ej. `cotizo_frio`, calculado
por días en la etapa) y **también** aparecer en "Hoy toca" (por tener
`proxima_accion_fecha` de hoy) al mismo tiempo — hoy `/tareas` los muestra
duplicados sin problema porque son dos listas separadas; en un flujo de
uno-a-la-vez sería confuso repetir al mismo cliente. Regla: si un
`clienteId` ya tiene una alerta de Briefing, se excluye de la sección
"Hoy toca" de la cola.

---

## Componentes

| Archivo | Qué hace | Nuevo/Existente |
|---|---|---|
| `app/(dashboard)/enfoque/page.tsx` | Server Component. Arma la cola, aplica `vistos`, muestra el primer item pendiente o la pantalla de fin | **Nuevo** |
| `lib/services/enfoque.service.ts` | `construirColaEnfoque(clientes, alertas, vistos)` — función pura que combina, deduplica y filtra. Mismo estilo que `briefing.service.ts` | **Nuevo** |
| `components/enfoque/ItemBriefingEnfoque.tsx` | Una alerta de Briefing dentro del flujo — Ejecutar/Ignorar, reusa `actionEjecutarAlertaBriefing`, al resolver navega al siguiente paso | **Nuevo** |
| `components/enfoque/ItemHoyTocaEnfoque.tsx` | Una tarjeta de "Hoy toca" — botón "Ir a la ficha →" y botón "Posponer para mañana" | **Nuevo** |
| `app/actions/enfoque.actions.ts` | `actionPosponerTarea(clienteId, etapaActual)` — inserta un seguimiento con `proxima_accion_fecha` = mañana, misma etapa, nota "Pospuesto desde el modo enfoque." Mismo patrón directo que `actionEjecutarAlertaBriefing` | **Nuevo** |
| `components/pipeline/BannerModoEnfoque.tsx` | Banner fijo arriba de la ficha del cliente cuando se llegó con `?volver=enfoque` — link "Siguiente tarea →" | **Nuevo** |
| `app/(dashboard)/clientes/[id]/page.tsx` | Lee `volver`/`vistos`/`total` de `searchParams` y renderiza el banner si corresponde | Existente, se extiende |
| `app/(dashboard)/tareas/page.tsx` | Botón "Empezar mi día →" que lleva a `/enfoque` | Existente, se extiende |

Se reutiliza sin cambios: `getClientesConEtapa`, `generarAlertasBriefing`,
`esPendienteHoy`, `getUltimosMensajesPorCliente`,
`actionEjecutarAlertaBriefing`, `textoPlantilla`, `ETAPA_META`,
`RegistrarSeguimientoForm` (sin tocar — el "resolver" de un item de "Hoy
toca" sigue siendo ese mismo formulario, visitado en su propia página).

---

## Pantalla de fin

Cuando la cola recalculada (menos `vistos`) queda vacía: pantalla simple
"Terminaste tus tareas de hoy 🎉" con link a `/dashboard`. Mismo mensaje si
Edwin entra a `/enfoque` sin ninguna tarea pendiente desde el inicio.

---

## Fuera de alcance (explícitamente)

- No se bloquea el resto del CRM — es enteramente opcional entrar.
- No se persiste el "Ignorar" del Briefing más allá de la sesión de
  enfoque actual (comportamiento ya existente, sin cambios).
- No se agrega tabla ni columna nueva en Supabase.
- No se toca `RegistrarSeguimientoForm` ni la ficha del cliente más allá
  del banner — el formulario de seguimiento sigue siendo el mismo.
- No se decompone la sesión de enfoque en el servidor (nada de tabla
  `sesiones_enfoque`) — todo el estado de progreso vive en la URL, se
  pierde si Edwin cierra la pestaña, y eso es aceptable (empieza de cero
  la próxima vez, sin arrastrar una sesión a medio terminar de otro día).

---

## Verificación

- `npx tsc --noEmit` limpio.
- Con 0 tareas pendientes: `/enfoque` muestra la pantalla de fin
  directamente.
- Con una mezcla de alertas de Briefing y clientes de "Hoy toca",
  incluyendo un cliente que califica para ambos: confirmar que aparece
  una sola vez (como alerta de Briefing) en la cola.
- Resolver una alerta de Briefing con "Ejecutar" → confirma que avanza al
  siguiente item y que esa alerta no vuelve a aparecer en esta sesión.
- "Ignorar" una alerta → avanza, y confirmar que **si Edwin sale y vuelve
  a entrar a `/enfoque` desde cero** (sin `vistos` en la URL) esa misma
  alerta reaparece — es el comportamiento esperado, no un bug.
- Click en "Ir a la ficha →" de un item de "Hoy toca" → confirmar que
  aparece el banner en `/clientes/[id]` y que "Siguiente tarea →" vuelve
  a `/enfoque` en el paso correcto, sin repetir al mismo cliente.
- "Posponer para mañana" → confirma que se crea el seguimiento con la
  fecha correcta y que el cliente sale de la cola de esta sesión.
- Terminar toda la cola → pantalla de fin.
