import {
  isPast,
  isToday,
  isTomorrow,
  differenceInCalendarDays,
  format,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";

export interface Urgencia {
  label: string;
  color: string;
}

/** Traduce una `proxima_accion_fecha` (o null) al mismo lenguaje de urgencia del diseño: Vencido / Hoy / Mañana / Esta semana / fecha. */
export function calcularUrgencia(fecha: string | null): Urgencia {
  if (!fecha) {
    return { label: "Sin fecha", color: "#444444" };
  }

  const dia = parseISO(fecha);

  if (isToday(dia)) {
    return { label: "Hoy", color: "#FF6B6B" };
  }
  if (isPast(dia)) {
    return { label: "Vencido", color: "#FF6B6B" };
  }
  if (isTomorrow(dia)) {
    return { label: "Mañana", color: "#FFDD00" };
  }
  if (differenceInCalendarDays(dia, new Date()) <= 7) {
    return { label: "Esta semana", color: "#FFDD00" };
  }
  return { label: format(dia, "d MMM", { locale: es }), color: "#555555" };
}

/** Un cliente "toca hoy" si su próxima acción es de hoy o quedó vencida. */
export function esPendienteHoy(fecha: string | null): boolean {
  if (!fecha) return false;
  const dia = parseISO(fecha);
  return isToday(dia) || isPast(dia);
}
