"use server";

import { revalidatePath } from "next/cache";
import { addDays, formatISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/action-result";
import type { Etapa, Seguimiento } from "@/lib/types";

/**
 * "Posponer para mañana" en el modo enfoque: registra un seguimiento real
 * (misma etapa, sin cambios) con proxima_accion_fecha = mañana. Es una
 * resolución de verdad, no un ocultar local — el cliente sale de la cola
 * de hoy porque deja de calificar para "Hoy toca", no por estar en `vistos`.
 */
export async function actionPosponerTarea(
  clienteId: string,
  etapaActual: Etapa | null
): Promise<ActionResult<Seguimiento>> {
  const supabase = await createClient();
  const manana = formatISO(addDays(new Date(), 1), { representation: "date" });

  const { data, error } = await supabase
    .from("seguimientos")
    .insert({
      cliente_id: clienteId,
      etapa: etapaActual ?? "prospecto",
      proxima_accion_fecha: manana,
      notas: "Pospuesto desde el modo enfoque.",
    })
    .select()
    .single();

  if (error || !data) {
    return { data: null, error: error?.message ?? "No se pudo posponer la tarea." };
  }

  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  revalidatePath("/tareas");
  revalidatePath("/enfoque");

  return { data, error: null };
}
