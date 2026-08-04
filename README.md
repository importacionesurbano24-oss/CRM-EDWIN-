# PasoCRM — Dormiluna

CRM de seguimiento paso a paso para Edwin (vendedor en Dormiluna). El contexto
completo del proyecto está en [`CLAUDE.md`](./CLAUDE.md).

**Estado de esta entrega:** login, dashboard ("qué toca hoy"), y el módulo de
clientes/pipeline (Kanban + Lista + detalle con historial). Cotizaciones,
pedidos con foto, WhatsApp y el agente de IA quedan para siguientes sesiones
(ver `CLAUDE.md` → Estado actual del proyecto).

## Antes de arrancar: crear el proyecto de Supabase (una sola vez, ~5 min)

Esto es lo único que no se puede hacer desde acá, porque requiere una cuenta
tuya. Sin este paso la app corre pero no puede guardar ni leer clientes.

1. Ve a [supabase.com](https://supabase.com) → crea una cuenta gratis (o
   entra si ya tienes) → **New Project**.
2. Ponle un nombre (ej. `pasocrm`), elige una contraseña de base de datos
   (guárdala en un lugar seguro) y la región más cercana. Espera 1-2 min a
   que el proyecto termine de crearse.
3. En el proyecto nuevo, ve a **Project Settings → API**. Ahí vas a ver tres
   valores:
   - **Project URL** → cópialo en `NEXT_PUBLIC_SUPABASE_URL` en `.env.local`
   - **anon public key** → cópialo en `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (dice "secret", click en el ojito para verla) →
     cópialo en `SUPABASE_SERVICE_ROLE_KEY`
4. Ve a **SQL Editor** (ícono de la izquierda) → **New query** → pega todo el
   contenido del archivo [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
   de este proyecto → **Run**. Esto crea las tablas `clientes` y
   `seguimientos` con sus reglas de seguridad.
5. Ve a **Authentication → Users** → **Add user** → **Create new user**.
   Pon tu correo y una contraseña — ese es el usuario con el que vas a
   entrar a PasoCRM (no hay registro público, solo login).

Con eso, `.env.local` queda completo para esta entrega (las variables de
WhatsApp/Claude/Resend se llenan más adelante, cuando se construyan esas
partes — no hacen falta todavía).

## Desarrollo local

```powershell
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) — te manda directo a
`/login`. Entra con el usuario que creaste en el paso 5.

## Comandos

```powershell
pnpm dev            # desarrollo local
pnpm build           # build de producción
pnpm lint            # revisa el código

# Regenerar los tipos de TypeScript desde el esquema real de Supabase
# (después de cualquier cambio de esquema, reemplaza lib/types.ts)
pnpm supabase gen types typescript --project-id [tu-project-id] > lib/types.ts
```

## Deploy

Este proyecto está listo para [Vercel](https://vercel.com): conecta el
repositorio y copia las mismas variables de `.env.local` en
**Project Settings → Environment Variables**. `NEXT_PUBLIC_APP_URL` debe
apuntar a la URL final (ej. `https://pasocrm.vercel.app`).

## Estructura

Ver la sección "Estructura de carpetas" en [`CLAUDE.md`](./CLAUDE.md) para el
mapa completo. Puntos de entrada útiles:

- `app/(auth)/login/` — login
- `app/(dashboard)/dashboard/` — "qué toca hoy"
- `app/(dashboard)/clientes/` — pipeline (Kanban/Lista) y detalle por cliente
- `app/actions/` — Server Actions (todas las mutaciones)
- `lib/data/clientes.ts` — consultas a Supabase
- `lib/ui/` — colores/etiquetas de etapa y cálculo de urgencia
- `supabase/migrations/0001_init.sql` — esquema de base de datos
- `docs/design-handoff/` — mockup original de diseño (Claude Design)
