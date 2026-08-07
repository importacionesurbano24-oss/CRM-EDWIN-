import { addDays, isSameDay, startOfDay } from "date-fns";

export const RANGOS_FECHA = [
  "todos",
  "vencidos",
  "hoy",
  "semana",
  "sin_fecha",
  "personalizado",
] as const;
export type RangoFecha = (typeof RANGOS_FECHA)[number];

export const RANGO_FECHA_META: Record<RangoFecha, string> = {
  todos: "Todos",
  vencidos: "Vencidos",
  hoy: "Hoy",
  semana: "Esta semana",
  sin_fecha: "Sin fecha",
  personalizado: "Personalizado",
};

export function esRangoFechaValido(valor: string | undefined): valor is RangoFecha {
  return !!valor && (RANGOS_FECHA as readonly string[]).includes(valor);
}

/** Compara `proxima_accion_fecha` (fecha, sin hora) contra el rango elegido. */
export function coincideRangoFecha(
  fecha: string | null,
  rango: RangoFecha,
  desde?: string,
  hasta?: string
): boolean {
  if (rango === "todos") return true;
  if (rango === "sin_fecha") return !fecha;
  if (!fecha) return false;

  const dia = startOfDay(new Date(`${fecha}T00:00:00`));
  const hoy = startOfDay(new Date());

  switch (rango) {
    case "vencidos":
      return dia < hoy;
    case "hoy":
      return isSameDay(dia, hoy);
    case "semana":
      return dia >= hoy && dia <= addDays(hoy, 7);
    case "personalizado": {
      if (desde && dia < startOfDay(new Date(`${desde}T00:00:00`))) return false;
      if (hasta && dia > startOfDay(new Date(`${hasta}T00:00:00`))) return false;
      return true;
    }
    default:
      return true;
  }
}
