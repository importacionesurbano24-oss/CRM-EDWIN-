"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NuevoSeguimientoSchema } from "@/lib/validators/cliente.schema";
import type { ActionResult } from "@/lib/action-result";
import type { Seguimiento } from "@/lib/types";

export async function actionRegistrarSeguimiento(
  _prevState: ActionResult<Seguimiento> | undefined,
  formData: FormData
): Promise<ActionResult<Seguimiento>> {
  const parsed = NuevoSeguimientoSchema.safeParse({
    cliente_id: formData.get("cliente_id"),
    etapa: formData.get("etapa"),
    proxima_accion: formData.get("proxima_accion"),
    proxima_accion_fecha: formData.get("proxima_accion_fecha"),
    notas: formData.get("notas"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const { cliente_id, etapa, proxima_accion, proxima_accion_fecha, notas } =
    parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seguimientos")
    .insert({
      cliente_id,
      etapa,
      proxima_accion: proxima_accion || null,
      proxima_accion_fecha: proxima_accion_fecha || null,
      notas: notas || null,
    })
    .select()
    .single();

  if (error || !data) {
    return {
      data: null,
      error: error?.message ?? "No se pudo guardar el seguimiento.",
    };
  }

  revalidatePath(`/clientes/${cliente_id}`);
  revalidatePath("/clientes");
  revalidatePath("/dashboard");

  return { data, error: null };
}
