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

export function formatMoneda(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}
