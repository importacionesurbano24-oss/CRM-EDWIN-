# Prompt de Arranque — PasoCRM

Estás trabajando en **PasoCRM**, el CRM de seguimiento paso a paso para Dormiluna. Lee el `CLAUDE.md` en la raíz del proyecto — ahí está todo el contexto de negocio, el stack y las decisiones de arquitectura. No tomes decisiones que lo contradigan.

## Contexto estratégico
Edwin es vendedor en Dormiluna y hoy no tiene forma de saber "qué toca hacer" con cada prospecto o cliente. El sistema debe decirle, de un vistazo, quién necesita seguimiento hoy — desde que cotiza hasta la posventa y el pedido de referidos.

## Estado actual
Proyecto vacío. No hay código, ni repo, ni proyecto de Supabase creado todavía.

## Lo que vamos a construir primero
El esqueleto del proyecto + el módulo de **clientes y pipeline**, que es el core sin el cual nada más tiene sentido:
1. Setup de Next.js 14 + TypeScript + Tailwind + shadcn/ui con la paleta negro/amarillo/verde lima (modo claro y oscuro).
2. Conexión a Supabase (Auth + tabla `clientes` + tabla `seguimientos`).
3. Vista `/clientes` con la lista de prospectos/clientes y su etapa actual.
4. Vista `/dashboard` mínima que muestre "quién necesita seguimiento hoy" ordenado por `proxima_accion_fecha`.

Todavía NO construyas: cotizaciones con link público, registro de pedidos con foto, ni la integración de WhatsApp/Claude — eso va en sesiones siguientes.

## Restricciones importantes
- No uses librerías fuera del stack definido en `CLAUDE.md` sin preguntar primero.
- Todos los textos de la interfaz en español.
- RLS activado desde el primer `CREATE TABLE`, aunque solo exista un usuario hoy.
- Sigue las convenciones de naming del `CLAUDE.md`.

## Tu primera tarea
Crea el proyecto Next.js desde cero (App Router + TypeScript + Tailwind), configura shadcn/ui con la paleta de marca, y monta el esquema inicial de Supabase para `clientes` y `seguimientos` con sus políticas RLS. Termina con la vista `/clientes` funcionando contra datos reales de Supabase (no mocks).

---
*Antes de escribir código, confirma que entendiste el contexto y dime si tienes dudas sobre alguna decisión de arquitectura.*
