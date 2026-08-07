// Cálculos puros para el Panel de informes — sin I/O, reciben los datos ya
// cargados (clientes, pedidos) y devuelven la forma lista para graficar.

import {
  eachDayOfInterval,
  format,
  isSameDay,
  startOfDay,
  subDays,
} from "date-fns";
import { es } from "date-fns/locale";
import type { ClienteConEtapa, Origen } from "@/lib/types";
import { ETAPA_META, ETAPA_ORDEN } from "@/lib/ui/etapa";

export const PERIODOS = [7, 30, 90] as const;
export type Periodo = (typeof PERIODOS)[number];

export function esPeriodoValido(valor: string | undefined): valor is `${Periodo}` {
  return !!valor && (PERIODOS as readonly number[]).includes(Number(valor));
}

/** Total en los últimos `dias` vs. el período anterior de la misma duración, para el % de cambio. */
export function contarNuevosEnPeriodo(
  fechas: string[],
  dias: number
): { actual: number; anterior: number; cambioPct: number | null } {
  const desde = startOfDay(subDays(new Date(), dias));
  const desdeAnterior = startOfDay(subDays(new Date(), dias * 2));

  const actual = fechas.filter((f) => new Date(f) >= desde).length;
  const anterior = fechas.filter((f) => {
    const dia = new Date(f);
    return dia >= desdeAnterior && dia < desde;
  }).length;

  const cambioPct =
    anterior === 0 ? null : Math.round(((actual - anterior) / anterior) * 100);

  return { actual, anterior, cambioPct };
}

export const ORIGEN_META: Record<Origen, { label: string; color: string }> = {
  "walk-in": { label: "Llegó a la tienda", color: "var(--chart-1)" },
  referido: { label: "Referido", color: "var(--chart-2)" },
  otro: { label: "Otro", color: "var(--chart-3)" },
};

export interface Barra {
  label: string;
  value: number;
  color: string;
}

export function clientesPorOrigen(clientes: ClienteConEtapa[]): Barra[] {
  return (Object.keys(ORIGEN_META) as Origen[]).map((origen) => ({
    label: ORIGEN_META[origen].label,
    color: ORIGEN_META[origen].color,
    value: clientes.filter((c) => c.origen === origen).length,
  }));
}

export function clientesPorEtapaActual(clientes: ClienteConEtapa[]): Barra[] {
  return ETAPA_ORDEN.map((etapa) => ({
    label: ETAPA_META[etapa].label,
    color: ETAPA_META[etapa].color,
    value: clientes.filter((c) => (c.etapa ?? "prospecto") === etapa).length,
  }));
}

export interface PuntoSerie {
  label: string;
  value: number;
}

/** Conteo por día de una lista de fechas ISO, para los últimos `dias` días (incluye hoy). */
export function serieDiaria(fechas: string[], dias: number): PuntoSerie[] {
  const hoy = startOfDay(new Date());
  const inicio = subDays(hoy, dias - 1);
  const rango = eachDayOfInterval({ start: inicio, end: hoy });

  return rango.map((dia) => ({
    label: format(dia, "d MMM", { locale: es }),
    value: fechas.filter((f) => isSameDay(new Date(f), dia)).length,
  }));
}
