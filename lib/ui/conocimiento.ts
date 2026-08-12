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
