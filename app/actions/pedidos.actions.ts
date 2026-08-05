"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NuevoPedidoSchema } from "@/lib/validators/pedido.schema";
import type { ActionResult } from "@/lib/action-result";
import type { Pedido } from "@/lib/types";

const DIAS_RECORDATORIO_POSVENTA = 7;

export async function actionRegistrarPedido(
  formData: FormData
): Promise<ActionResult<Pedido>> {
  const parsed = NuevoPedidoSchema.safeParse({
    cliente_id: formData.get("cliente_id"),
    cotizacion_id: formData.get("cotizacion_id") || undefined,
    monto: formData.get("monto"),
    fecha_compra: formData.get("fecha_compra"),
    foto: formData.get("foto"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const { cliente_id, cotizacion_id, monto, fecha_compra, foto } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Sesión expirada, vuelve a iniciar sesión." };
  }

  const extension = foto.name.split(".").pop() || "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("pedidos")
    .upload(path, foto, { contentType: foto.type });

  if (uploadError) {
    return {
      data: null,
      error: `No se pudo subir la foto: ${uploadError.message}`,
    };
  }

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .insert({
      cliente_id,
      cotizacion_id: cotizacion_id || null,
      foto_url: path,
      monto,
      fecha_compra,
    })
    .select()
    .single();

  if (pedidoError || !pedido) {
    await supabase.storage.from("pedidos").remove([path]);
    return {
      data: null,
      error: pedidoError?.message ?? "No se pudo registrar el pedido.",
    };
  }

  // Dispara el recordatorio de seguimiento posventa a los N días.
  const fechaRecordatorio = new Date(`${fecha_compra}T00:00:00`);
  fechaRecordatorio.setDate(
    fechaRecordatorio.getDate() + DIAS_RECORDATORIO_POSVENTA
  );

  await supabase.from("seguimientos").insert({
    cliente_id,
    etapa: "posventa",
    proxima_accion: "Preguntar cómo le quedó el pedido",
    proxima_accion_fecha: fechaRecordatorio.toISOString().slice(0, 10),
  });

  // Si el pedido viene de una cotización, esa cotización ya se concretó.
  if (cotizacion_id) {
    await supabase
      .from("cotizaciones")
      .update({ estado: "aceptada" })
      .eq("id", cotizacion_id);
  }

  revalidatePath("/pedidos");
  revalidatePath("/dashboard");
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${cliente_id}`);
  if (cotizacion_id) revalidatePath("/cotizaciones");

  return { data: pedido, error: null };
}
