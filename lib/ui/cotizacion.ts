import type { Cotizacion, EstadoCotizacion } from "@/lib/types";
import { etapaBg } from "./etapa";

export const ESTADO_COTIZACION_META: Record<
  EstadoCotizacion,
  { label: string; color: string }
> = {
  enviada: { label: "Enviada", color: "#888888" },
  vista: { label: "Vista", color: "#CCFF00" },
  aceptada: { label: "Aceptada", color: "#22C55E" },
  vencida: { label: "Vencida", color: "#FF6B6B" },
};

export { etapaBg as estadoBg };

/** Días desde el envío antes de mostrarla como vencida (si no se aceptó). */
const DIAS_VALIDEZ = 15;

/**
 * Estado a mostrar en pantalla: si ya pasó DIAS_VALIDEZ y nadie la marcó
 * "aceptada", se ve como vencida aunque en la base siga en enviada/vista.
 * Evita necesitar un job en segundo plano solo para esto.
 */
export function estadoEfectivo(
  cotizacion: Pick<Cotizacion, "estado" | "created_at">
): EstadoCotizacion {
  if (cotizacion.estado === "aceptada" || cotizacion.estado === "vencida") {
    return cotizacion.estado;
  }
  const diasTranscurridos =
    (Date.now() - new Date(cotizacion.created_at).getTime()) /
    (1000 * 60 * 60 * 24);
  return diasTranscurridos > DIAS_VALIDEZ ? "vencida" : cotizacion.estado;
}

export const FILTROS_COTIZACION = [
  "pendientes",
  "vencidas",
  "sin_respuesta",
  "seguimiento",
] as const;
export type FiltroCotizacion = (typeof FILTROS_COTIZACION)[number];

export const FILTRO_COTIZACION_META: Record<
  FiltroCotizacion,
  { label: string; color: string }
> = {
  pendientes: { label: "Pendientes de respuesta", color: "#FFDD00" },
  vencidas: { label: "Vencidas", color: "#FF6B6B" },
  sin_respuesta: { label: "Sin abrir", color: "#888888" },
  seguimiento: { label: "Vistas — necesitan seguimiento", color: "#CCFF00" },
};

/**
 * A qué "punto de acción" pertenece esta cotización. Todo se calcula sobre
 * estadoEfectivo, así que los buckets no se pisan entre sí (una vencida no
 * cuenta también como "sin_respuesta", por ejemplo).
 */
export function coincideConFiltroCotizacion(
  cotizacion: Pick<Cotizacion, "estado" | "created_at">,
  filtro: FiltroCotizacion
): boolean {
  const estado = estadoEfectivo(cotizacion);
  switch (filtro) {
    case "pendientes":
      return estado === "enviada" || estado === "vista";
    case "vencidas":
      return estado === "vencida";
    case "sin_respuesta":
      return estado === "enviada";
    case "seguimiento":
      return estado === "vista";
    default:
      return false;
  }
}

export function formatMoneda(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}
