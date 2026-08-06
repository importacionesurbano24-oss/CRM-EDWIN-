// Motor de reglas del Daily Briefing. Puro y determinista a propósito:
// decide QUÉ clientes se alertan y a QUÉ etapa se sugiere moverlos.
// El agente de IA (lib/claude/briefing.ts) solo redacta el texto — nunca
// decide la regla ni la etapa destino, siguiendo el mismo principio que
// malla.service en el hermano MallaSync: "el agente sugiere, el servicio
// valida".

import { differenceInCalendarDays, addDays, formatISO } from "date-fns";
import type { ClienteConEtapa, Etapa } from "@/lib/types";

export type ReglaBriefing =
  | "cotizo_frio"
  | "cotizo_seguimiento"
  | "compro_posventa"
  | "posventa_referido"
  | "sin_accion";

export interface AlertaBriefing {
  clienteId: string;
  clienteNombre: string;
  etapaActual: Etapa;
  /** A qué etapa mover al cliente si Edwin le da "Ejecutar". null = solo registrar contacto, sin cambiar de etapa. */
  etapaSugerida: Etapa | null;
  dias: number;
  regla: ReglaBriefing;
}

const UMBRAL_COTIZO_SEGUIMIENTO = 2;
const UMBRAL_COTIZO_FRIO = 5;
const UMBRAL_COMPRO_POSVENTA = 30;
const UMBRAL_POSVENTA_REFERIDO = 15;
const UMBRAL_SIN_ACCION = 10;

function diasEnEtapa(cliente: ClienteConEtapa): number {
  const fecha = cliente.etapa_actualizada_at ?? cliente.created_at;
  return differenceInCalendarDays(new Date(), new Date(fecha));
}

/**
 * Una alerta por cliente como máximo, con la regla más específica y urgente
 * primero. Un cliente que califica para varias reglas (ej. cotizó hace 8
 * días también pasa el umbral genérico de "sin acción") solo recibe la más
 * relevante para no duplicar tarjetas en el panel.
 */
export function generarAlertasBriefing(
  clientes: ClienteConEtapa[]
): AlertaBriefing[] {
  const alertas: AlertaBriefing[] = [];

  for (const cliente of clientes) {
    const etapa = cliente.etapa ?? "prospecto";
    const dias = diasEnEtapa(cliente);
    const base = { clienteId: cliente.id, clienteNombre: cliente.nombre, etapaActual: etapa, dias };

    if (etapa === "compro" && dias > UMBRAL_COMPRO_POSVENTA) {
      alertas.push({ ...base, etapaSugerida: "posventa", regla: "compro_posventa" });
    } else if (etapa === "posventa" && dias > UMBRAL_POSVENTA_REFERIDO) {
      alertas.push({ ...base, etapaSugerida: "referido_solicitado", regla: "posventa_referido" });
    } else if (etapa === "cotizo" && dias > UMBRAL_COTIZO_FRIO) {
      alertas.push({ ...base, etapaSugerida: null, regla: "cotizo_frio" });
    } else if (etapa === "cotizo" && dias > UMBRAL_COTIZO_SEGUIMIENTO) {
      alertas.push({ ...base, etapaSugerida: null, regla: "cotizo_seguimiento" });
    } else if (dias > UMBRAL_SIN_ACCION) {
      alertas.push({ ...base, etapaSugerida: null, regla: "sin_accion" });
    }
  }

  const prioridad: Record<ReglaBriefing, number> = {
    compro_posventa: 0,
    posventa_referido: 1,
    cotizo_frio: 2,
    cotizo_seguimiento: 3,
    sin_accion: 4,
  };
  return alertas.sort(
    (a, b) => prioridad[a.regla] - prioridad[b.regla] || b.dias - a.dias
  );
}

/** Texto base sin IA — se usa como fallback si Claude falla y como primer render (instantáneo, sin costo). */
export function textoPlantilla(alerta: AlertaBriefing): {
  situacion: string;
  accionSugerida: string;
} {
  switch (alerta.regla) {
    case "compro_posventa":
      return {
        situacion: `${alerta.clienteNombre} compró hace ${alerta.dias} días.`,
        accionSugerida: "Mover a Posventa y preguntar cómo le quedó el pedido.",
      };
    case "posventa_referido":
      return {
        situacion: `${alerta.clienteNombre} lleva ${alerta.dias} días en Posventa.`,
        accionSugerida: "Pedirle que refiera a alguien.",
      };
    case "cotizo_frio":
      return {
        situacion: `${alerta.clienteNombre} lleva ${alerta.dias} días en Cotizó sin respuesta.`,
        accionSugerida: "Último intento de contacto, o considerar cerrarlo.",
      };
    case "cotizo_seguimiento":
      return {
        situacion: `${alerta.clienteNombre} lleva ${alerta.dias} días en Cotizó sin respuesta.`,
        accionSugerida: "Enviar mensaje de seguimiento.",
      };
    case "sin_accion":
      return {
        situacion: `${alerta.clienteNombre} lleva ${alerta.dias} días sin ninguna acción registrada.`,
        accionSugerida: "Contactar hoy para no perder el hilo.",
      };
  }
}

/**
 * Qué seguimiento registrar cuando Edwin le da "Ejecutar" a una alerta.
 * Si hay etapaSugerida, el seguimiento la aplica (mueve la tarjeta); si no,
 * queda en la misma etapa pero marca que hoy tocó actuar, para que el
 * cliente no vuelva a aparecer en el briefing de mañana con los mismos días.
 */
export function construirSeguimientoParaEjecutar(alerta: AlertaBriefing): {
  etapa: Etapa;
  proxima_accion: string;
  proxima_accion_fecha: string;
  notas: string;
} {
  const hoy = formatISO(new Date(), { representation: "date" });
  const notas = "Generado desde el Daily Briefing.";

  switch (alerta.regla) {
    case "compro_posventa":
      return {
        etapa: "posventa",
        proxima_accion: "Preguntar cómo le quedó el pedido",
        proxima_accion_fecha: formatISO(addDays(new Date(), 7), { representation: "date" }),
        notas,
      };
    case "posventa_referido":
      return {
        etapa: "referido_solicitado",
        proxima_accion: "Pedir que refiera a alguien",
        proxima_accion_fecha: formatISO(addDays(new Date(), 3), { representation: "date" }),
        notas,
      };
    case "cotizo_frio":
      return {
        etapa: alerta.etapaActual,
        proxima_accion: "Último intento de contacto",
        proxima_accion_fecha: hoy,
        notas,
      };
    case "cotizo_seguimiento":
      return {
        etapa: alerta.etapaActual,
        proxima_accion: "Seguimiento enviado",
        proxima_accion_fecha: formatISO(addDays(new Date(), 3), { representation: "date" }),
        notas,
      };
    case "sin_accion":
      return {
        etapa: alerta.etapaActual,
        proxima_accion: "Contactado desde el briefing",
        proxima_accion_fecha: hoy,
        notas,
      };
  }
}
