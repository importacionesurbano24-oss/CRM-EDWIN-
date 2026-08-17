"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redactarBriefing } from "@/lib/claude/briefing";
import {
  construirSeguimientoParaEjecutar,
  type AlertaBriefing,
} from "@/lib/services/briefing.service";
import type { ActionResult } from "@/lib/action-result";
import type { Seguimiento } from "@/lib/types";
import type { NivelIA } from "@/lib/claude/modelos";

export interface TextoBriefing {
  clienteId: string;
  situacion: string;
  accionSugerida: string;
}

/**
 * Redacta con IA las alertas que ya vienen calculadas por briefing.service
 * (una sola llamada para todas). El panel ya se ve con texto de plantilla
 * antes de llamar esto — este action solo mejora la redacción.
 */
export async function actionRedactarBriefing(
  alertas: AlertaBriefing[],
  nivel?: NivelIA
): Promise<ActionResult<TextoBriefing[]>> {
  try {
    const mapa = await redactarBriefing(alertas, nivel);
    const textos: TextoBriefing[] = alertas
      .filter((a) => mapa.has(a.clienteId))
      .map((a) => {
        const texto = mapa.get(a.clienteId)!;
        return { clienteId: a.clienteId, ...texto };
      });
    return { data: textos, error: null };
  } catch (error) {
    console.error("actionRedactarBriefing:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo redactar el briefing con IA.",
    };
  }
}

/** Registra el seguimiento correspondiente a "Ejecutar" en una alerta del briefing. */
export async function actionEjecutarAlertaBriefing(
  alerta: AlertaBriefing
): Promise<ActionResult<Seguimiento>> {
  const payload = construirSeguimientoParaEjecutar(alerta);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seguimientos")
    .insert({ cliente_id: alerta.clienteId, ...payload })
    .select()
    .single();

  if (error || !data) {
    return {
      data: null,
      error: error?.message ?? "No se pudo registrar el seguimiento.",
    };
  }

  revalidatePath(`/clientes/${alerta.clienteId}`);
  revalidatePath("/clientes");
  revalidatePath("/dashboard");

  return { data, error: null };
}
