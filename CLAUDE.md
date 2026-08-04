@AGENTS.md

# PasoCRM — CRM de seguimiento paso a paso (Dormiluna)

## 🎯 Qué es este proyecto

PasoCRM resuelve un problema muy concreto: hoy, cuando un prospecto entra a la tienda Dormiluna, cotiza o compra, no hay ningún sistema que le diga al vendedor **qué toca hacer después** con ese cliente. Se pierden cotizaciones sin seguimiento, no hay registro claro de qué compró cada cliente, y no se pide de forma sistemática que el cliente refiera a un familiar o amigo.

El usuario del sistema es **Edwin** (vendedor en Dormiluna), y el sistema gestiona el ciclo de vida completo de cada prospecto/cliente: prospecto → cotización (con link consultable) → compra (con foto del pedido) → seguimiento posventa → solicitud de referido → posible nueva venta.

**Propósito de negocio doble:**
1. Uso diario real en Dormiluna para no perder ninguna venta ni seguimiento.
2. Servir como **vitrina/prototipo**: si funciona bien, Edwin lo personalizará y lo venderá como CRM a medida para otros negocios. El código debe quedar limpio y modular para poder clonarse, pero **sin construir multi-tenant completo todavía** — eso se agrega cuando haya un segundo cliente real confirmado (ver "Contexto de escala").

Sigue las instrucciones al pie de la letra. Cuando algo no esté especificado, toma la decisión más simple y razonable, o pregunta.

## 🔒 Seguridad

- Toda credencial en `.env.local` — nunca hardcodeada.
- Crea `.env.example` con todas las variables documentadas (sin valores reales).
- `.gitignore` debe incluir `.env*`, `.next`, `node_modules`.
- `SUPABASE_SERVICE_ROLE_KEY` **nunca** se usa en el cliente/frontend — solo en Server Actions o API Routes.
- Row Level Security (RLS) activado en todas las tablas de Supabase desde el día 1, aunque hoy solo exista un usuario — evita reescribir políticas después.
- El link público de cotización (`/cotizacion/[token]`) usa un token random no adivinable (UUID v4), no un ID incremental — para que un cliente no pueda ver la cotización de otro cambiando el número en la URL.
- Verificar siempre la firma del webhook de WhatsApp (Meta) antes de procesar cualquier mensaje entrante.

## 🏗️ Stack técnico

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Frontend | **Next.js 14+ (App Router)** + TypeScript | Ya lo maneja Edwin, SSR + API routes en un solo repo |
| UI | **Tailwind CSS + shadcn/ui** | Rápido de personalizar al estilo "Vixiees" (negro/amarillo/verde lima) |
| Backend | **Next.js Server Actions + API Routes** (mismo repo) | Evita levantar un segundo servicio para un MVP de un solo usuario |
| Base de datos | **PostgreSQL vía Supabase** | Relacional real (clientes, cotizaciones, pedidos con relaciones claras) |
| Auth | **Supabase Auth** (email/password) | Un solo usuario hoy, pero soporta agregar roles después sin migrar de proveedor |
| Storage | **Supabase Storage** | Fotos de pedidos, con URLs firmadas |
| Tiempo real | **Supabase Realtime** | Recordatorios/notificaciones en vivo de "qué toca hacer hoy" |
| Mensajería | **WhatsApp Business Cloud API (Meta, oficial)** | Ver nota de riesgo abajo — nunca librerías no oficiales |
| Agente IA | **Claude API (Anthropic)**, modelo Sonnet | Sugiere próxima acción y redacta borradores de mensajes de seguimiento |
| Email | **Resend** | Notificaciones internas (ej. "cotización vista por el cliente") |
| Deploy | **Vercel** (todo: frontend + API routes + webhook de WhatsApp) | Un solo lugar de deploy, cero DevOps adicional |
| Gestor de paquetes | **pnpm** | Más rápido, menos disco |

**⚠️ Decisión importante — WhatsApp:** se usa **exclusivamente la Cloud API oficial de Meta**, nunca librerías no oficiales tipo `whatsapp-web.js` o `Baileys`. Esas simulan un WhatsApp Web real y Meta puede **bloquear el número de negocio** sin aviso — inaceptable para una herramienta de venta diaria. La Cloud API oficial requiere verificar el negocio en Meta Business Manager (puede tomar unos días) pero es la única opción confiable a largo plazo.

## 📁 Estructura de carpetas

```
pasocrm/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx        # KPIs de ventas, seguimientos pendientes hoy
│   │   ├── clientes/page.tsx         # Pipeline: lista de prospectos/clientes
│   │   ├── clientes/[id]/page.tsx    # Historial completo de un cliente
│   │   ├── cotizaciones/page.tsx     # Lista + crear cotización
│   │   └── pedidos/page.tsx          # Registro de pedidos con foto
│   ├── cotizacion/[token]/page.tsx   # Página PÚBLICA — el cliente ve su cotización
│   ├── api/
│   │   └── whatsapp/webhook/route.ts # Webhook entrante de WhatsApp Cloud API
│   ├── actions/                      # Server Actions (mutaciones)
│   └── layout.tsx
├── components/
│   ├── ui/                           # shadcn/ui
│   └── pipeline/                     # Componentes específicos del pipeline
├── lib/
│   ├── supabase/                     # Clientes de Supabase (server/browser)
│   ├── whatsapp/                     # Envío de mensajes vía Cloud API
│   ├── claude/                       # Wrapper del agente (prompt + contexto de cliente)
│   └── types.ts                      # Tipos generados de Supabase
├── .env.example
└── package.json
```

## ⚙️ Comandos esenciales

```powershell
# Instalar dependencias
pnpm install

# Desarrollo local
pnpm dev

# Generar tipos de Supabase (después de cualquier cambio de esquema)
npx supabase gen types typescript --project-id [tu-project-id] > lib/types.ts

# Build
pnpm build

# Deploy
vercel --prod
```

## 🔑 Variables de entorno

```
# Supabase — Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # solo backend, NUNCA al cliente

# WhatsApp Business Cloud API — Meta Business Manager > WhatsApp > API Setup
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=      # cadena que tú inventas, se configura igual en Meta

# Claude API — console.anthropic.com
ANTHROPIC_API_KEY=

# Resend — resend.com/api-keys
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=                # ej. https://pasocrm.vercel.app, para generar links de cotización
```

## 🧠 Arquitectura y decisiones técnicas

**Ciclo de vida del cliente (pipeline):** cada registro en `clientes` tiene una `etapa` (prospecto → cotizó → compró → posventa → referido_solicitado). El dashboard siempre muestra primero "qué toca hacer hoy", calculado a partir de `proxima_accion_fecha` en `seguimientos` — esto es el corazón del producto, no un extra.

**Cotización con link público:** cuando Edwin crea una cotización, el sistema genera un token UUID y una página pública `/cotizacion/[token]` sin necesidad de login. Cuando el cliente la abre, se registra `vista_en` y se dispara una notificación en tiempo real (Supabase Realtime) a Edwin — así sabe cuándo actuar.

**Pedido con foto:** al confirmar una venta, Edwin sube la foto del pedido (Supabase Storage) y el sistema crea el registro de `pedidos`, vinculado a la cotización si existía. Esto dispara automáticamente un recordatorio de seguimiento posventa a N días.

**Agente de WhatsApp — modo asistido, no autónomo (MVP):** el agente de Claude **sugiere y redacta** el mensaje de seguimiento según el historial del cliente, pero Edwin lo revisa y aprueba antes de enviar. No se envían mensajes automáticos sin revisión humana en esta fase — el riesgo de que un mensaje mal generado dañe una relación con un cliente real no vale la pena todavía. Pasar a envío autónomo es una decisión explícita para más adelante, no un default.

**Ventana de 24 horas de WhatsApp:** la Cloud API solo permite mensajes de formato libre dentro de las 24h desde el último mensaje del cliente. Fuera de esa ventana se requieren plantillas pre-aprobadas por Meta. El agente debe saber en qué ventana está antes de sugerir qué tipo de mensaje enviar.

## 📐 Convenciones del proyecto

- Toda la UI y los datos de negocio en **español**; nombres de variables, funciones y archivos en **inglés**.
- Archivos y carpetas en `kebab-case`; componentes React en `PascalCase`; funciones y variables en `camelCase`.
- Server Components por defecto; `'use client'` solo donde haya interactividad real.
- Mutaciones vía Server Actions en `app/actions/`, no vía fetch a API routes salvo el webhook de WhatsApp (que sí necesita ser una API route pública).
- Commits estilo Conventional Commits (`feat:`, `fix:`, `chore:`).

## 🚫 Lo que NO debes hacer

- No implementes facturación electrónica ni control de inventario — quedó explícitamente descartado.
- No uses librerías no oficiales de WhatsApp (`whatsapp-web.js`, `Baileys`, etc.) — riesgo real de bloqueo del número de negocio.
- No hagas que el agente de IA envíe mensajes de WhatsApp de forma autónoma sin aprobación humana en esta fase.
- No construyas multi-tenant completo (tabla de tenants, RLS por `negocio_id`, planes de suscripción) todavía — es prematuro sin un segundo cliente confirmado. Ver "Contexto de escala".
- No expongas `SUPABASE_SERVICE_ROLE_KEY` en ningún componente cliente.
- No agregues dependencias fuera de este stack sin justificarlo primero.

## 🗄️ Modelo de datos

| Tabla | Campos clave | Relaciones | Notas |
|-------|-------------|------------|-------|
| `clientes` | id, nombre, telefono_whatsapp, email, origen, referido_por_id | referido_por_id → clientes.id | origen: walk-in / referido / otro |
| `seguimientos` | id, cliente_id, etapa, proxima_accion, proxima_accion_fecha, notas | cliente_id → clientes.id | etapa: prospecto / cotizo / compro / posventa / referido_solicitado |
| `cotizaciones` | id, cliente_id, productos (jsonb), monto_total, token_publico, estado, vista_en | cliente_id → clientes.id | estado: enviada / vista / aceptada / vencida |
| `pedidos` | id, cliente_id, cotizacion_id (nullable), foto_url, monto, fecha_compra | cliente_id → clientes.id, cotizacion_id → cotizaciones.id | dispara seguimiento posventa |
| `seguimientos_posventa` | id, pedido_id, fecha_contacto, satisfaccion, solicito_referido, notas | pedido_id → pedidos.id | |
| `mensajes_whatsapp` | id, cliente_id, direccion, contenido, generado_por_agente, timestamp | cliente_id → clientes.id | direccion: entrante / saliente |

RLS activado en todas las tablas, filtrando por `auth.uid()` del usuario dueño del registro (hoy solo Edwin).

## 🔌 Integraciones externas

| Servicio | Para qué | Cómo se integra |
|----------|----------|-----------------|
| Supabase | DB, Auth, Storage, Realtime | SDK oficial `@supabase/supabase-js` + `@supabase/ssr` |
| WhatsApp Cloud API (Meta) | Recibir/enviar mensajes | Webhook en `app/api/whatsapp/webhook/route.ts` + fetch directo a Graph API para enviar |
| Claude API (Anthropic) | Agente: sugiere próxima acción, redacta mensajes | SDK oficial `@anthropic-ai/sdk`, contexto = historial del cliente + etapa |
| Resend | Notificaciones internas por email | SDK oficial `resend` |

## 📈 Contexto de escala

- **Diseñado para:** 1 vendedor (Edwin), cientos de clientes/prospectos en Dormiluna. No optimizado para múltiples negocios todavía.
- **Cuándo revisar arquitectura:** el día que haya un segundo negocio/cliente real confirmado (no antes) — ahí se agrega `negocio_id` a las tablas core, se activa RLS multi-tenant, y se decide si habrá plan de pago.
- **Bottleneck más probable al crecer:** los límites de la ventana de 24h y plantillas aprobadas de WhatsApp Cloud API, no la base de datos ni el hosting.
- **Presupuesto actual:** $0 en hosting (Vercel + Supabase free tier); costo variable solo por uso de la API de Claude (agente).

## ✅ Estado actual del proyecto

- [x] Proyecto Next.js inicializado (App Router + TypeScript + Tailwind v4 + shadcn/ui), paleta de marca y fuente Outfit
- [x] Login con Supabase Auth + `proxy.ts` protegiendo `(dashboard)` y refrescando sesión
- [x] Esquema de Supabase (`clientes`, `seguimientos`, vista `clientes_con_etapa`) con RLS por `user_id` — falta correrlo en un proyecto real (ver README)
- [x] `/dashboard` — KPIs, "hoy toca", actividad reciente, pipeline
- [x] `/clientes` — Kanban y Lista, alta de cliente
- [x] `/clientes/[id]` — historial y registro de nuevo seguimiento (incluye cambio de etapa)
- [x] Página `/setup` con instrucciones si faltan las variables de Supabase
- [ ] Cotizaciones con link público
- [ ] Registro de pedidos con foto
- [ ] Integración de WhatsApp Business Cloud API
- [ ] Agente de Claude (sugerir próxima acción, redactar mensajes)
- [ ] Exportación a Excel/PDF
- [ ] Deploy en Vercel

**Pendiente antes de usar en producción:** crear el proyecto real de Supabase
y llenar `.env.local` (ver README.md) — hoy corre contra un proyecto vacío.
