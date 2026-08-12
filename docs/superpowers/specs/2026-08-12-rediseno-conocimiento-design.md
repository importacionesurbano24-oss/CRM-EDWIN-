# Rediseño visual de /conocimiento ("Entrenamiento del agente")

## Contexto

`/conocimiento` es la página donde Edwin carga lo que el agente de IA sabe
del negocio (Dormiluna): catálogo, datos de la empresa, tono, promociones,
garantías, proceso de venta, objeciones y preguntas frecuentes. Hoy funciona
(guarda en Supabase, genera embeddings, alimenta el RAG del chat y de
WhatsApp) pero visualmente son textareas simples con un botón Guardar — no
se siente como un producto terminado.

El pedido original asumía una tabla (`training_config`) y una ruta
(`/entrenamiento`) que no existen — el proyecto real usa la tabla
`conocimiento_negocio` (con columna `embedding` generada automáticamente vía
Voyage AI, usada por el RAG de WhatsApp y del chat) y la ruta ya existente
`/conocimiento`. Este spec parte de la base real del repo, confirmada
leyendo el código, no de la suposición inicial.

**Objetivo:** subir el nivel visual y funcional de esta página a un
estándar de producto SaaS (HubSpot / Notion / Dapta), **sin tocar backend**
— ni tablas nuevas, ni server actions nuevas, ni cambios al esquema.

## Decisiones tomadas con el usuario

- **Alcance:** las 8 secciones existentes usan el componente nuevo (no solo
  3) — consistencia visual completa en la página, un solo estilo.
- **"Probar agente":** modal, reemplaza el panel de chat que hoy está
  siempre visible en la columna derecha (`ChatNegocio`).
- **Catálogo:** no lleva el botón simple "Cargar archivo" — ya tiene
  `CargaMasivaCatalogo` (sube PDF/Excel/foto, la IA lo analiza y propone
  cambios); agregar el botón simple ahí sería redundante.
- **Layout de las 8 cards:** una sola columna con scroll vertical, sin tabs
  ni sidebar de navegación — más simple, sin curva de aprendizaje nueva.
- **`section_key` correctos** (el pedido original tenía nombres que no
  existen en el `CHECK` constraint de la tabla): `catalogo`, `objeciones`,
  `preguntas_frecuentes`, `garantias`, `tono`, `proceso_venta`,
  `promociones`, `datos_empresa`. Específicamente: **no** `info_empresa`
  (es `datos_empresa`) ni `tono_agente` (es `tono`).

## Arquitectura — solo UI

Nada en `app/actions/`, `lib/services/`, `lib/data/` ni en las migraciones
SQL cambia. Todo pasa por `actionGuardarSeccionConocimiento`
(`app/actions/conocimiento.actions.ts`), que ya valida con Zod, hace upsert
en `conocimiento_negocio` y genera el embedding — se reutiliza tal cual.

### Archivos

| Archivo | Cambio |
|---|---|
| `components/conocimiento/TrainingSection.tsx` | **Nuevo.** Reemplaza la función interna `TarjetaSeccion` que hoy vive dentro de `FormularioConocimiento.tsx`. Se ubica en `components/conocimiento/` (no en una carpeta `training/` nueva) para no fragmentar la carpeta que ya agrupa este dominio. |
| `components/conocimiento/FormularioConocimiento.tsx` | Editado. Sigue recorriendo `ORDEN_SECCIONES` (las 8), ahora instancia `TrainingSection` en vez de la tarjeta vieja. `CargaMasivaCatalogo` se mantiene sin cambios, debajo de la card de catálogo. |
| `components/conocimiento/AgentTestModal.tsx` | **Nuevo.** Botón "Probar agente" + el chat existente en modal. |
| `components/chat/PanelChat.tsx` | Editado, mínimo: se agrega prop opcional `expandidoInicial?: boolean` para poder abrirlo directo en modo pantalla completa (ya tiene ese modo; hoy solo se activa al mandar el primer mensaje). Evita duplicar la UI de chat que ya existe. |
| `app/(dashboard)/conocimiento/page.tsx` | Editado. Header con badge de progreso + barra visual + botón "Probar agente". Se quita `ChatNegocio` de la columna derecha (pasa al modal). `EstadisticasConocimiento` se queda sola en la columna derecha. |
| `lib/ui/conocimiento.ts` | Editado. Se agrega `PLANTILLAS_CONOCIMIENTO: Record<SeccionConocimiento, string>` con un ejemplo base por sección (ver más abajo), y una descripción corta por sección para el header de cada card (hoy `SECCION_META` solo tiene `label`/`placeholder`/`icon`, se le suma `descripcion`). |

`ChatNegocio.tsx` deja de importarse en esta página. Se verifica en
implementación si algún otro archivo lo usa antes de decidir si se borra o
se deja sin uso (no se borra a ciegas).

## `TrainingSection.tsx`

**Props:**
```ts
{
  seccion: SeccionConocimiento;
  fila: ConocimientoNegocio | null;
}
```

**Contenido de la card:**
1. Header: ícono (`SECCION_META[seccion].icon`) + label + descripción corta
   (nueva) + badge "Configurado" (verde, si `contenido.trim() !== ""`) /
   "Pendiente" (gris).
2. Textarea con auto-resize (crece con el contenido, altura por CSS/JS
   sobre `scrollHeight`, sin scroll interno) + contador de caracteres.
3. Tres botones:
   - **Guardar** → llama a `actionGuardarSeccionConocimiento` (mismo
     patrón `useTransition` que ya usa `TarjetaSeccion` hoy).
   - **Descargar .txt** → genera un `Blob` en el cliente, nombre de archivo
     `{seccion}_{fecha-ISO}.txt`, sin llamada al servidor.
   - **Cargar archivo** → input `type="file"` oculto, `accept=".txt,.md"`,
     lee con `FileReader` y monta el texto crudo en el textarea (sin pasar
     por Claude — a diferencia de `CargaMasivaCatalogo`, que sí analiza con
     IA). **No aparece en la card de `catalogo`** (ver decisión de alcance).
4. Botón **"Usar plantilla"**: carga `PLANTILLAS_CONOCIMIENTO[seccion]` en
   el textarea. Si ya hay contenido, pide confirmación con `window.confirm`
   antes de sobrescribir (sin componente nuevo — no existe `AlertDialog` en
   el proyecto hoy y no se justifica agregarlo solo para esto).
5. Indicador "Guardado hace X" — `formatDistanceToNow` (`date-fns`, locale
   `es`) sobre `fila.updated_at`; se refresca al guardar exitosamente.

**Estados:** pending (spinner en Guardar), éxito (check verde ~2s), error
(toast rojo vía `sonner`) — mismo patrón que ya usa `TarjetaSeccion` hoy
(incluye el caso de "guardó el texto pero no hay embedding" si falta
`VOYAGE_API_KEY`, que ya maneja el action actual).

## `AgentTestModal.tsx`

Botón "Probar agente" en el header de la página → abre `PanelChat` con
`expandidoInicial` en modo pantalla completa. Mismo `historialChat` que ya
carga la página (`getHistorialChat`), mismo `actionEnviarMensajeChat` —
es el chat de negocio real, que ya usa `buscar_conocimiento` (RPC con RLS)
para traer los fragmentos relevantes del conocimiento guardado. Cero lógica
nueva de backend; es literalmente "probar el agente con el conocimiento
actual".

## Plantillas por sección (`PLANTILLAS_CONOCIMIENTO`)

Ejemplos base, ajustables por Edwin después de cargarlos (borrador inicial,
no texto final):

- **catalogo**: `"Colchón Ortopédico Pro — 160x190 — $1.200.000 — Beneficios: soporte lumbar, 10 años de garantía..."`
- **datos_empresa**: `"Dormiluna — Cúcuta — Horario: Lun-Sáb 8am-6pm — Domicilios sin costo en compras +$800.000..."`
- **tono**: `"El agente tutea al cliente, es cálido y cercano, usa emojis con moderación, siempre saluda por el nombre..."`
- **promociones**: `"2x1 en almohadas viscoelásticas todo agosto. Financiación sin intereses a 3 meses con tarjetas en compras desde $1.000.000."`
- **garantias**: `"10 años contra hundimiento en colchones ortopédicos y viscoelásticos. 2 años en bases cama. Cambio total si el hundimiento supera 2.5 cm; no cubre manchas ni mal uso."`
- **proceso_venta**: `"1) Preguntar para quién es y si tiene molestia de espalda. 2) Mostrar máximo 2 opciones según presupuesto. 3) Ofrecer probarlo en tienda. 4) Explicar garantía y forma de pago. 5) Cerrar con fecha de entrega."`
- **objeciones**: `"\"Está muy caro\" → Pregunta '¿caro respecto a qué?'; si es calidad, refuerza la garantía; si es presupuesto, ofrece la opción básica o financiación. \"Lo voy a pensar\" → Pregunta qué le genera duda, sin insistir en cerrar de inmediato."`
- **preguntas_frecuentes**: `"¿Hacen domicilios? Sí, gratis en compras +$800.000 dentro de Cúcuta, 24-48h. ¿Reciben el colchón viejo? Sí, retiro gratuito con compra nueva. ¿Pagos en cuotas? Sí, tarjetas hasta 12 meses."`

## Header de la página

`X de 8 secciones configuradas` + barra de progreso visual — mismo cálculo
que ya usa `EstadisticasConocimiento`
(`filas.filter(f => f.contenido.trim() !== "").length`), promovido al
header. `EstadisticasConocimiento` conserva el resto de sus stats (búsqueda
semántica activa, caracteres, última actualización) para no duplicar
información.

## Fuera de alcance (explícitamente)

- No se toca ningún server action, servicio, ni la tabla `conocimiento_negocio`.
- No se agrega tabla ni columna nueva.
- No se cambia la ruta (`/conocimiento`, no `/entrenamiento`).
- No se agrega el botón "Cargar archivo" simple a la card de catálogo.
- No se agregan tabs/sidebar de navegación entre secciones.
- No se decide todavía si `ChatNegocio.tsx` se borra — solo se deja de usar en esta página.

## Verificación

- `pnpm build` sin errores de tipos (los `section_key` deben tipar contra
  `SeccionConocimiento`, no strings sueltos).
- Probar en el navegador (`pnpm dev`): guardar una sección y confirmar que
  el badge pasa a "Configurado", el indicador de guardado se actualiza, y
  que sigue apareciendo el aviso de "sin búsqueda semántica" si falta
  `VOYAGE_API_KEY` (comportamiento ya existente que no debe romperse).
  Probar Descargar .txt, Cargar archivo, y Usar plantilla (con y sin
  contenido previo, para el confirm). Abrir el modal "Probar agente" y
  confirmar que responde usando el conocimiento recién guardado.
- Confirmar que `CargaMasivaCatalogo` sigue funcionando igual que antes
  (no debería haber tocado ese archivo).
