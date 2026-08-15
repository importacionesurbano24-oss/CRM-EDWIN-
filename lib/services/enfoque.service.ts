// Combina Briefing + "Hoy toca" en una sola cola priorizada para el modo
// enfoque. Ver docs/superpowers/specs/2026-08-14-modo-enfoque-design.md
// para el razonamiento completo (por qué taskKey y no clienteId, por qué
// `vistos` solo importa para "Ignorar", etc).

import { isToday, parseISO } from "date-fns";
import type { ClienteConEtapa } from "@/lib/types";
import type { AlertaBriefing } from "@/lib/services/briefing.service";

export type TipoEnfoqueItem = "briefing" | "hoy_toca";

interface EnfoqueItemBase {
  /** Id estable y único del item — no es el clienteId, para no pisar
   * distintas acciones del mismo cliente en `vistos`. */
  taskKey: string;
  clienteId: string;
  clienteNombre: string;
  /** Menor = más urgente. */
  prioridad: number;
}

export type EnfoqueItem =
  | (EnfoqueItemBase & { tipo: "briefing"; alerta: AlertaBriefing })
  | (EnfoqueItemBase & { tipo: "hoy_toca"; cliente: ClienteConEtapa });

// Prioridad unificada: intercala "Hoy toca" con las reglas del Briefing
// por urgencia real, en vez de mostrar siempre todo el Briefing primero.
const PRIORIDAD_BRIEFING: Record<AlertaBriefing["regla"], number> = {
  whatsapp_sin_responder: 0,
  compro_posventa: 2,
  posventa_referido: 3,
  cotizo_frio: 5,
  cotizo_seguimiento: 6,
  sin_accion: 7,
};
const PRIORIDAD_HOY_TOCA_VENCIDO = 1;
const PRIORIDAD_HOY_TOCA_HOY = 4;

function prioridadHoyToca(fecha: string | null): number {
  if (!fecha) return PRIORIDAD_HOY_TOCA_HOY;
  return isToday(parseISO(fecha)) ? PRIORIDAD_HOY_TOCA_HOY : PRIORIDAD_HOY_TOCA_VENCIDO;
}

/**
 * Arma la cola del modo enfoque: combina, deduplica (un cliente no
 * aparece dos veces por la misma oportunidad — si ya generó una alerta de
 * Briefing, se descarta su entrada de "Hoy toca"), ordena por prioridad,
 * y filtra los `taskKey` ya vistos en esta sesión. Función pura — sin
 * llamadas a Supabase ni a la IA, mismo estilo que `generarAlertasBriefing`.
 */
export function construirColaEnfoque(
  alertasBriefing: AlertaBriefing[],
  tareasHoy: ClienteConEtapa[],
  vistos: Set<string>
): EnfoqueItem[] {
  const itemsBriefing: EnfoqueItem[] = alertasBriefing.map((alerta) => ({
    taskKey: `briefing:${alerta.clienteId}:${alerta.regla}`,
    tipo: "briefing",
    clienteId: alerta.clienteId,
    clienteNombre: alerta.clienteNombre,
    prioridad: PRIORIDAD_BRIEFING[alerta.regla],
    alerta,
  }));

  const clientesConBriefing = new Set(itemsBriefing.map((item) => item.clienteId));

  const itemsHoyToca: EnfoqueItem[] = tareasHoy
    .filter((cliente) => !clientesConBriefing.has(cliente.id))
    .map((cliente) => ({
      taskKey: `hoy_toca:${cliente.id}`,
      tipo: "hoy_toca",
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      prioridad: prioridadHoyToca(cliente.proxima_accion_fecha),
      cliente,
    }));

  return [...itemsBriefing, ...itemsHoyToca]
    .filter((item) => !vistos.has(item.taskKey))
    .sort((a, b) => a.prioridad - b.prioridad);
}
