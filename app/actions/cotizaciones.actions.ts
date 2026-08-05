"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NuevaCotizacionSchema } from "@/lib/validators/cotizacion.schema";
import type { ActionResult } from "@/lib/action-result";
import type { Cotizacion } from "@/lib/types";

export async function actionCrearCotizacion(
  input: unknown
): Promise<ActionResult<Cotizacion>> {
  const parsed = NuevaCotizacionSchema.safeParse(input);

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const { cliente_id, productos } = parsed.data;
  const monto_total = productos.reduce(
    (suma, p) => suma + p.cantidad * p.precio_unitario,
    0
  );

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cotizaciones")
    .insert({ cliente_id, productos, monto_total })
    .select()
    .single();

  if (error || !data) {
    return {
      data: null,
      error: error?.message ?? "No se pudo crear la cotización.",
    };
  }

  revalidatePath("/cotizaciones");
  revalidatePath("/dashboard");

  return { data, error: null };
}

export async function actionMarcarAceptada(
  cotizacionId: string
): Promise<ActionResult<Cotizacion>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cotizaciones")
    .update({ estado: "aceptada" })
    .eq("id", cotizacionId)
    .select()
    .single();

  if (error || !data) {
    return {
      data: null,
      error: error?.message ?? "No se pudo actualizar la cotización.",
    };
  }

  revalidatePath("/cotizaciones");
  return { data, error: null };
}
