"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NuevoClienteSchema } from "@/lib/validators/cliente.schema";
import type { ActionResult } from "@/lib/action-result";
import type { Cliente } from "@/lib/types";

export async function actionCrearCliente(
  formData: FormData
): Promise<ActionResult<Cliente>> {
  const parsed = NuevoClienteSchema.safeParse({
    nombre: formData.get("nombre"),
    telefono_whatsapp: formData.get("telefono_whatsapp"),
    email: formData.get("email"),
    origen: formData.get("origen"),
    proxima_accion: formData.get("proxima_accion"),
    proxima_accion_fecha: formData.get("proxima_accion_fecha"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const {
    nombre,
    telefono_whatsapp,
    email,
    origen,
    proxima_accion,
    proxima_accion_fecha,
  } = parsed.data;

  const supabase = await createClient();

  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .insert({
      nombre,
      telefono_whatsapp,
      email: email || null,
      origen,
    })
    .select()
    .single();

  if (clienteError || !cliente) {
    return {
      data: null,
      error: clienteError?.message ?? "No se pudo crear el cliente.",
    };
  }

  const { error: seguimientoError } = await supabase
    .from("seguimientos")
    .insert({
      cliente_id: cliente.id,
      etapa: "prospecto",
      proxima_accion: proxima_accion || "Primer contacto",
      proxima_accion_fecha: proxima_accion_fecha || null,
    });

  revalidatePath("/clientes");
  revalidatePath("/dashboard");

  if (seguimientoError) {
    return {
      data: cliente,
      error: `Cliente creado, pero no se pudo registrar el primer seguimiento: ${seguimientoError.message}`,
    };
  }

  return { data: cliente, error: null };
}
