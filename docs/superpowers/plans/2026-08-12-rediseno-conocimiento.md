# Rediseño visual de /conocimiento ("Entrenamiento del agente") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar visualmente la página `/conocimiento` (8 secciones de "conocimiento del negocio" que alimentan al agente de IA) para que se sienta como un producto SaaS terminado, sin tocar backend.

**Architecture:** Todo el trabajo es de UI. Se reemplaza la tarjeta simple que hoy vive inline en `FormularioConocimiento.tsx` por un componente `TrainingSection` reutilizable con más funcionalidad (descargar, cargar archivo, plantilla, indicador de guardado). El chat de prueba que hoy está siempre visible (`ChatNegocio`) se mueve a un modal disparado por un botón "Probar agente" en el header, reutilizando el `PanelChat` existente (que ya tiene un modo pantalla completa, solo se le agregan dos props). Cero tablas, cero server actions nuevas — todo pasa por `actionGuardarSeccionConocimiento`, que ya existe.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Button, Textarea, Label, Badge) · lucide-react · date-fns · sonner.

**Nota sobre verificación:** este proyecto no tiene ningún test runner instalado (ni vitest, ni jest, ni playwright — confirmado en `package.json`), y ningún otro componente del repo tiene tests. Siguiendo la convención ya establecida, este plan no introduce un framework de testing solo para esta tarea de UI (sería alcance fuera de lo pedido). En su lugar, cada tarea se verifica con `npx tsc --noEmit` (chequeo de tipos rápido) tras escribir el código, y el plan termina con `pnpm build` + una pasada manual en el navegador.

---

### Task 1: Agregar descripciones y plantillas a `lib/ui/conocimiento.ts`

**Files:**
- Modify: `lib/ui/conocimiento.ts` (archivo completo, 69 líneas hoy)

- [ ] **Step 1: Reescribir el archivo completo con `descripcion` por sección y el nuevo `PLANTILLAS_CONOCIMIENTO`**

Reemplazar todo el contenido de `lib/ui/conocimiento.ts` por:

```ts
import {
  Building2,
  Package,
  Tag,
  ShieldCheck,
  Route,
  MessagesSquare,
  CircleHelp,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import type { SeccionConocimiento } from "@/lib/types";

export const SECCION_META: Record<
  SeccionConocimiento,
  { label: string; descripcion: string; placeholder: string; icon: LucideIcon }
> = {
  datos_empresa: {
    label: "Datos de la empresa",
    descripcion: "Dirección, horarios, redes sociales y forma de contacto del negocio.",
    placeholder: "Dirección, horarios de atención, redes sociales...",
    icon: Building2,
  },
  catalogo: {
    label: "Catálogo",
    descripcion: "Productos, precios y características que el agente puede recomendar.",
    placeholder: "Colchón ortopédico XL — $XXX.XXX, base cama doble reforzada...",
    icon: Package,
  },
  promociones: {
    label: "Promociones vigentes",
    descripcion: "Ofertas y descuentos vigentes que el agente puede mencionar.",
    placeholder: "2x1 en almohadas todo agosto...",
    icon: Tag,
  },
  garantias: {
    label: "Garantías",
    descripcion:
      "Condiciones de garantía para responder con seguridad sobre devoluciones y cambios.",
    placeholder: "10 años contra hundimiento en colchones ortopédicos...",
    icon: ShieldCheck,
  },
  proceso_venta: {
    label: "Proceso de venta",
    descripcion:
      "Los pasos que sigue una venta, para que el agente guíe la conversación en orden.",
    placeholder: "Primero preguntar tipo de cama, luego mostrar catálogo...",
    icon: Route,
  },
  objeciones: {
    label: "Objeciones frecuentes",
    descripcion: "Respuestas ya probadas a las dudas más comunes de los clientes.",
    placeholder: '"Está muy caro" → ..., "Lo voy a pensar" → ...',
    icon: MessagesSquare,
  },
  preguntas_frecuentes: {
    label: "Preguntas frecuentes",
    descripcion: "Dudas que preguntan seguido, con la respuesta que debe dar el agente.",
    placeholder: "¿Hacen domicilios? ¿Reciben el colchón viejo?",
    icon: CircleHelp,
  },
  tono: {
    label: "Tono de voz",
    descripcion: "Cómo debe sonar el agente al escribir — cercanía, formalidad, uso de emojis.",
    placeholder: "Cercano, tuteando, nunca agresivo...",
    icon: Volume2,
  },
};

export const ORDEN_SECCIONES: SeccionConocimiento[] = [
  "datos_empresa",
  "catalogo",
  "promociones",
  "garantias",
  "proceso_venta",
  "objeciones",
  "preguntas_frecuentes",
  "tono",
];

/**
 * Ejemplos base para el botón "Usar plantilla" de cada sección — texto de
 * partida ajustable por Edwin, no contenido final.
 */
export const PLANTILLAS_CONOCIMIENTO: Record<SeccionConocimiento, string> = {
  datos_empresa: `Dormiluna — Cúcuta — Horario: Lun-Sáb 8am-6pm — Domicilios sin costo en compras +$800.000. Dirección: [completar]. Instagram: [completar].`,
  catalogo: `Colchón Ortopédico Pro — 160x190 — $1.200.000 — Beneficios: soporte lumbar, 10 años de garantía.
Base cama doble reforzada — $450.000 — Estructura en madera, soporta hasta 200kg.`,
  promociones: `2x1 en almohadas viscoelásticas todo agosto. Financiación sin intereses a 3 meses con tarjetas en compras desde $1.000.000.`,
  garantias: `10 años contra hundimiento en colchones ortopédicos y viscoelásticos. 2 años en bases cama. Cambio total si el hundimiento supera 2.5 cm; no cubre manchas ni mal uso.`,
  proceso_venta: `1) Preguntar para quién es y si tiene molestia de espalda. 2) Mostrar máximo 2 opciones según presupuesto. 3) Ofrecer probarlo en tienda. 4) Explicar garantía y forma de pago. 5) Cerrar con fecha de entrega.`,
  objeciones: `"Está muy caro" → Pregunta "¿caro respecto a qué?"; si es calidad, refuerza la garantía; si es presupuesto, ofrece la opción básica o financiación. "Lo voy a pensar" → Pregunta qué le genera duda, sin insistir en cerrar de inmediato.`,
  preguntas_frecuentes: `¿Hacen domicilios? Sí, gratis en compras +$800.000 dentro de Cúcuta, 24-48h. ¿Reciben el colchón viejo? Sí, retiro gratuito con compra nueva. ¿Pagos en cuotas? Sí, tarjetas hasta 12 meses.`,
  tono: `El agente tutea al cliente, es cálido y cercano, usa emojis con moderación, siempre saluda por el nombre.`,
};
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos relacionados a `lib/ui/conocimiento.ts` (el archivo todavía no lo importa nadie con la firma nueva, así que no debería romper nada existente).

- [ ] **Step 3: Commit**

```bash
git add lib/ui/conocimiento.ts
git commit -m "feat: agregar descripciones y plantillas a las secciones de conocimiento"
```

---

### Task 2: Extender `PanelChat` para poder abrirse ya expandido y notificar el cierre

**Files:**
- Modify: `components/chat/PanelChat.tsx:22-48`

- [ ] **Step 1: Agregar las props `expandidoInicial` y `onCerrar`**

En `components/chat/PanelChat.tsx`, reemplazar las líneas 22-48:

```tsx
export function PanelChat({
  clienteId,
  titulo,
  placeholder,
  mensajeVacio,
  historialInicial,
  accionExtra,
  alCerrarIrA,
}: {
  clienteId: string | null;
  titulo: string;
  placeholder: string;
  mensajeVacio: string;
  historialInicial: MensajeChat[];
  accionExtra?: { label: string; mensaje: string };
  alCerrarIrA?: string;
}) {
  const router = useRouter();
  const [mensajes, setMensajes] = useState(historialInicial);
  const [pending, setPending] = useState(false);
  const [expandido, setExpandido] = useState(false);

  function cerrar() {
    setExpandido(false);
    if (alCerrarIrA) router.push(alCerrarIrA);
  }
```

por:

```tsx
export function PanelChat({
  clienteId,
  titulo,
  placeholder,
  mensajeVacio,
  historialInicial,
  accionExtra,
  alCerrarIrA,
  expandidoInicial = false,
  onCerrar,
}: {
  clienteId: string | null;
  titulo: string;
  placeholder: string;
  mensajeVacio: string;
  historialInicial: MensajeChat[];
  accionExtra?: { label: string; mensaje: string };
  alCerrarIrA?: string;
  /** Monta el panel directo en modo pantalla completa, sin esperar el primer mensaje. */
  expandidoInicial?: boolean;
  /** Se llama al cerrar — para que quien lo montó en un modal pueda desmontarlo. */
  onCerrar?: () => void;
}) {
  const router = useRouter();
  const [mensajes, setMensajes] = useState(historialInicial);
  const [pending, setPending] = useState(false);
  const [expandido, setExpandido] = useState(expandidoInicial);

  function cerrar() {
    setExpandido(false);
    if (alCerrarIrA) router.push(alCerrarIrA);
    onCerrar?.();
  }
```

El resto del archivo (líneas 49 en adelante) no cambia.

- [ ] **Step 2: Verificar que los dos consumidores existentes siguen compilando**

Run: `npx tsc --noEmit`
Expected: sin errores en `components/pipeline/ChatAgente.tsx` ni `components/dashboard/ChatNegocio.tsx` (ninguno pasa las props nuevas, ambas son opcionales con default `false`/`undefined`, comportamiento sin cambios para ellos).

- [ ] **Step 3: Commit**

```bash
git add components/chat/PanelChat.tsx
git commit -m "feat: permitir abrir PanelChat expandido y notificar su cierre"
```

---

### Task 3: Crear `TrainingSection.tsx`

**Files:**
- Create: `components/conocimiento/TrainingSection.tsx`

- [ ] **Step 1: Escribir el componente**

```tsx
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Download, FileUp, Sparkles } from "lucide-react";
import { actionGuardarSeccionConocimiento } from "@/app/actions/conocimiento.actions";
import { SECCION_META, PLANTILLAS_CONOCIMIENTO } from "@/lib/ui/conocimiento";
import type { ConocimientoNegocio, SeccionConocimiento } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const EXTENSIONES_CARGABLES = ".txt,.md";

export function TrainingSection({
  seccion,
  fila,
}: {
  seccion: SeccionConocimiento;
  fila: ConocimientoNegocio | null;
}) {
  const meta = SECCION_META[seccion];
  const Icono = meta.icon;

  const [contenido, setContenido] = useState(fila?.contenido ?? "");
  const [tieneEmbedding, setTieneEmbedding] = useState(fila?.embedding != null);
  const [guardadoEn, setGuardadoEn] = useState(fila?.updated_at ?? null);
  const [mostrarCheck, setMostrarCheck] = useState(false);
  const [pending, startTransition] = useTransition();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [contenido]);

  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, []);

  function guardar() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("seccion", seccion);
      formData.set("contenido", contenido);
      const result = await actionGuardarSeccionConocimiento(formData);

      if (!result.data) {
        toast.error(result.error);
        return;
      }

      setTieneEmbedding(result.data.embeddingGenerado);
      setGuardadoEn(result.data.fila.updated_at);
      setMostrarCheck(true);
      checkTimeoutRef.current = setTimeout(() => setMostrarCheck(false), 2000);

      if (result.data.embeddingGenerado) {
        toast.success("Información guardada.");
      } else {
        toast.warning(
          "Se guardó el texto, pero la búsqueda semántica no está activa (falta configurar VOYAGE_API_KEY)."
        );
      }
    });
  }

  function descargar() {
    const fecha = format(new Date(), "yyyy-MM-dd");
    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `${seccion}_${fecha}.txt`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  function cargarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = () => setContenido(String(lector.result ?? ""));
    lector.readAsText(archivo);
    e.target.value = "";
  }

  function usarPlantilla() {
    if (contenido.trim() !== "") {
      const confirmar = window.confirm(
        "Ya hay contenido en esta sección. ¿Reemplazarlo con la plantilla?"
      );
      if (!confirmar) return;
    }
    setContenido(PLANTILLAS_CONOCIMIENTO[seccion]);
  }

  const configurado = contenido.trim() !== "";

  return (
    <div className="rounded-[14px] border border-border bg-card p-6">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icono className="size-4 text-[#888]" />
          <Label htmlFor={seccion}>{meta.label}</Label>
        </div>
        <Badge variant={configurado ? "default" : "outline"}>
          {configurado ? "Configurado" : "Pendiente"}
        </Badge>
      </div>
      <p className="mb-4 text-[13px] text-[#666]">{meta.descripcion}</p>

      <Textarea
        ref={textareaRef}
        id={seccion}
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        rows={4}
        placeholder={meta.placeholder}
        className="mb-1.5 resize-none overflow-hidden"
      />
      <div className="mb-4 flex items-center justify-between text-[11px] text-[#555]">
        <span>{contenido.length.toLocaleString("es-CO")} caracteres</span>
        <span className={configurado && !tieneEmbedding ? "text-amber-500" : ""}>
          {guardadoEn
            ? `Guardado ${formatDistanceToNow(new Date(guardadoEn), {
                addSuffix: true,
                locale: es,
              })}${configurado && !tieneEmbedding ? " · sin búsqueda semántica" : ""}`
            : "Sin guardar todavía"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={guardar} disabled={pending} className="gap-1.5">
          {pending && "Guardando..."}
          {!pending && mostrarCheck && (
            <>
              <Check className="size-3.5" />
              Guardado
            </>
          )}
          {!pending && !mostrarCheck && "Guardar"}
        </Button>

        <Button variant="outline" size="sm" onClick={descargar} className="gap-1.5">
          <Download className="size-3.5" />
          Descargar .txt
        </Button>

        {seccion !== "catalogo" && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={EXTENSIONES_CARGABLES}
              onChange={cargarArchivo}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5"
            >
              <FileUp className="size-3.5" />
              Cargar archivo
            </Button>
          </>
        )}

        <Button variant="ghost" size="sm" onClick={usarPlantilla} className="gap-1.5">
          <Sparkles className="size-3.5" />
          Usar plantilla
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores en `components/conocimiento/TrainingSection.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/conocimiento/TrainingSection.tsx
git commit -m "feat: crear TrainingSection con descarga, carga de archivo y plantillas"
```

---

### Task 4: Usar `TrainingSection` en `FormularioConocimiento`

**Files:**
- Modify: `components/conocimiento/FormularioConocimiento.tsx` (archivo completo, reemplaza las 102 líneas actuales)

- [ ] **Step 1: Reemplazar todo el archivo**

```tsx
"use client";

import { ORDEN_SECCIONES } from "@/lib/ui/conocimiento";
import type { ConocimientoNegocio } from "@/lib/types";
import { TrainingSection } from "@/components/conocimiento/TrainingSection";
import { CargaMasivaCatalogo } from "@/components/conocimiento/CargaMasivaCatalogo";

export function FormularioConocimiento({
  filas,
}: {
  filas: ConocimientoNegocio[];
}) {
  const porSeccion = new Map(filas.map((f) => [f.seccion, f]));

  return (
    <div className="flex flex-col gap-4">
      {ORDEN_SECCIONES.map((seccion) => {
        const fila = porSeccion.get(seccion) ?? null;
        return (
          <div key={seccion} className="flex flex-col gap-4">
            {/* key con updated_at: sin esto, después de guardar por carga
            masiva la tarjeta no se entera del contenido nuevo — su estado
            local solo se inicializa una vez, al montar. */}
            <TrainingSection key={fila?.updated_at ?? seccion} seccion={seccion} fila={fila} />
            {seccion === "catalogo" && <CargaMasivaCatalogo />}
          </div>
        );
      })}
    </div>
  );
}
```

Esto elimina la función interna `TarjetaSeccion` y todos sus imports que ya no se usan (`Button`, `Textarea`, `Label`, `Badge`, `useState`, `useTransition`, `toast`, `actionGuardarSeccionConocimiento`, `SECCION_META` — todos viven ahora dentro de `TrainingSection`).

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add components/conocimiento/FormularioConocimiento.tsx
git commit -m "refactor: usar TrainingSection en FormularioConocimiento"
```

---

### Task 5: Crear `AgentTestModal.tsx`

**Files:**
- Create: `components/conocimiento/AgentTestModal.tsx`

- [ ] **Step 1: Escribir el componente**

```tsx
"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { MensajeChat } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PanelChat } from "@/components/chat/PanelChat";

export function AgentTestModal({ historialInicial }: { historialInicial: MensajeChat[] }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setAbierto(true)} className="gap-1.5">
        <Sparkles className="size-3.5" />
        Probar agente
      </Button>
      {abierto && (
        <PanelChat
          clienteId={null}
          titulo="Probar agente"
          placeholder="Pregúntale algo a tu negocio..."
          mensajeVacio="Pregúntale al agente sobre tu negocio: cuántos leads tienes, quién lleva más tiempo sin responder, cuántas ventas cerraste este mes, o pídele un mensaje para publicar en redes."
          historialInicial={historialInicial}
          expandidoInicial
          onCerrar={() => setAbierto(false)}
        />
      )}
    </>
  );
}
```

Reutiliza el mismo hilo de conversación (`chat_agente` con `cliente_id = null`) que ya usaba `ChatNegocio` — no se pierde historial al mover el chat al modal.

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add components/conocimiento/AgentTestModal.tsx
git commit -m "feat: crear AgentTestModal para probar el agente desde /conocimiento"
```

---

### Task 6: Header con progreso + reemplazar `ChatNegocio` por el modal en `page.tsx`

**Files:**
- Modify: `app/(dashboard)/conocimiento/page.tsx` (archivo completo, reemplaza las 58 líneas actuales)

- [ ] **Step 1: Reemplazar todo el archivo**

```tsx
import { createClient } from "@/lib/supabase/server";
import { getConocimientoNegocio } from "@/lib/data/conocimiento";
import { getInfoNegocio, getHistorialChat } from "@/lib/data/chat";
import { ORDEN_SECCIONES } from "@/lib/ui/conocimiento";
import { FormularioConocimiento } from "@/components/conocimiento/FormularioConocimiento";
import { EstadisticasConocimiento } from "@/components/conocimiento/EstadisticasConocimiento";
import { AgentTestModal } from "@/components/conocimiento/AgentTestModal";

export default async function ConocimientoPage() {
  const supabase = await createClient();
  const [filas, infoNegocioAntigua, historialChat] = await Promise.all([
    getConocimientoNegocio(supabase),
    getInfoNegocio(supabase),
    getHistorialChat(supabase, null),
  ]);

  const hayContenidoNuevo = filas.some((f) => f.contenido.trim() !== "");
  const contenidoAntiguo =
    !hayContenidoNuevo && infoNegocioAntigua?.contenido.trim()
      ? infoNegocioAntigua.contenido
      : null;

  const completas = filas.filter((f) => f.contenido.trim() !== "").length;
  const total = ORDEN_SECCIONES.length;
  const porcentaje = total === 0 ? 0 : Math.round((completas / total) * 100);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-white">
            Entrenamiento del agente
          </h1>
          <p className="mt-0.5 text-[13px] text-[#444]">
            Edita lo que tu agente sabe del negocio y pruébalo con el botón de la derecha.
          </p>
        </div>
        <AgentTestModal historialInicial={historialChat} />
      </div>

      <div className="mb-6 max-w-md">
        <div className="mb-1.5 flex items-center justify-between text-[12px] text-[#888]">
          <span>
            {completas} de {total} secciones configuradas
          </span>
          <span>{porcentaje}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1A1A1A]">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      {contenidoAntiguo && (
        <div className="mb-6 max-w-2xl rounded-[14px] border border-[#FFDD00]/30 bg-[#FFDD00]/5 p-5">
          <p className="mb-2 text-[13px] font-semibold text-[#FFDD00]">
            Tenías esto guardado en la Configuración anterior
          </p>
          <p className="mb-3 whitespace-pre-wrap text-[13px] text-[#AAA]">
            {contenidoAntiguo}
          </p>
          <p className="text-[12px] text-[#666]">
            Cópialo a la sección que corresponda abajo. Este aviso
            desaparece en cuanto guardes cualquier sección.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <FormularioConocimiento filas={filas} />

        <div className="flex flex-col gap-6">
          <EstadisticasConocimiento filas={filas} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/conocimiento/page.tsx"
git commit -m "feat: header con progreso y modal de prueba en /conocimiento"
```

---

### Task 7: Verificación end-to-end

**Files:** ninguno (solo verificación manual)

- [ ] **Step 1: Build completo**

Run: `pnpm build`
Expected: build exitoso, sin errores de tipos ni de lint.

- [ ] **Step 2: Confirmar que `ChatNegocio.tsx` sigue teniendo un consumidor real**

Run: `grep -rn "ChatNegocio" --include="*.tsx" app components`
Expected: aparece en `app/(dashboard)/dashboard/page.tsx` (además de su propia definición) — confirma que sigue en uso ahí y que está bien no borrarlo, solo se dejó de usar en `/conocimiento`.

- [ ] **Step 3: Prueba manual en el navegador**

Run: `pnpm dev`, abrir `/conocimiento` y verificar:
1. Las 8 secciones se ven con el nuevo diseño (ícono, descripción, badge Configurado/Pendiente).
2. El header muestra "X de 8 secciones configuradas" y la barra de progreso coincide.
3. Escribir en una sección vacía → guardar → el badge pasa a "Configurado", aparece el check verde momentáneo, y el indicador de "Guardado hace..." se actualiza.
4. "Descargar .txt" baja un archivo con el nombre `{seccion}_{fecha}.txt` y el contenido correcto.
5. "Cargar archivo" con un `.txt` de prueba monta el contenido en el textarea.
6. "Usar plantilla" en una sección vacía la llena directo; en una con contenido, pide confirmación antes de reemplazar.
7. La card de catálogo NO tiene botón "Cargar archivo", pero sí conserva debajo la herramienta `CargaMasivaCatalogo` funcionando igual que antes.
8. El botón "Probar agente" del header abre el chat en pantalla completa, responde usando el conocimiento recién guardado, y el botón de cerrar (X) lo cierra correctamente (no queda una tarjeta chica flotando).
9. La página sigue en modo oscuro nativo sin romperse ningún estilo existente (`EstadisticasConocimiento`, el aviso de "Configuración anterior" si aplica).

- [ ] **Step 4: Commit final si Step 3 encontró ajustes menores de estilo**

```bash
git add -A
git commit -m "fix: ajustes visuales tras prueba manual de /conocimiento"
```

(Omitir este paso si no hubo cambios.)

---

## Self-Review

- **Cobertura del spec:** los 8 secciones con el componente nuevo (Task 3-4), catálogo sin botón "Cargar archivo" (Task 3, condición `seccion !== "catalogo"`), modal reemplaza el panel lateral (Task 5-6), header con progreso (Task 6), plantillas y descripciones (Task 1), `section_key` correctos (`datos_empresa`/`tono`, no `info_empresa`/`tono_agente` — usados en todo el plan). Todo cubierto.
- **Sin placeholders:** cada Step tiene código completo, sin "TODO" ni "similar a...".
- **Consistencia de tipos:** `SeccionConocimiento`, `ConocimientoNegocio`, `ActionResult`/`GuardarSeccionResult` (implícito en `result.data.fila` / `result.data.embeddingGenerado`) se usan igual en Task 3 que en `app/actions/conocimiento.actions.ts` ya existente — no se inventan campos nuevos.
