"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NuevoClienteSchema } from "@/lib/validators/cliente.schema";
import type { ActionResult } from "@/lib/action-result";
import type { Cliente } from "@/lib/types";

const DIAS_RECORDATORIO_POSVENTA = 7;
const TIPOS_FOTO_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANO_FOTO_MAXIMO = 5 * 1024 * 1024; // 5MB

export async function actionCrearCliente(
  formData: FormData
): Promise<ActionResult<Cliente>> {
  const parsed = NuevoClienteSchema.safeParse({
    nombre: formData.get("nombre"),
    telefono_whatsapp: formData.get("telefono_whatsapp"),
    email: formData.get("email"),
    origen: formData.get("origen"),
    etapa: formData.get("etapa"),
    proxima_accion: formData.get("proxima_accion"),
    proxima_accion_fecha: formData.get("proxima_accion_fecha"),
    notas: formData.get("notas"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const {
    nombre,
    telefono_whatsapp,
    email,
    origen,
    etapa,
    proxima_accion,
    proxima_accion_fecha,
    notas,
  } = parsed.data;

  // La foto del pedido solo aplica si la etapa elegida es "Compró" — se
  // valida antes de crear nada para no dejar un cliente a medias si algo
  // está mal con la foto.
  const fotoPedido = formData.get("foto_pedido");
  const tieneFoto = fotoPedido instanceof File && fotoPedido.size > 0;
  const montoPedido = Number(formData.get("monto_pedido"));

  if (etapa === "compro" && tieneFoto) {
    if (!montoPedido || montoPedido <= 0) {
      return { data: null, error: "Ingresa el monto del pedido." };
    }
    if (!TIPOS_FOTO_PERMITIDOS.includes((fotoPedido as File).type)) {
      return { data: null, error: "Solo se aceptan fotos JPG, PNG o WebP." };
    }
    if ((fotoPedido as File).size > TAMANO_FOTO_MAXIMO) {
      return { data: null, error: "La foto no puede pesar más de 5MB." };
    }
  }

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

  let advertenciaPedido: string | null = null;
  let huboPedido = false;

  if (etapa === "compro" && tieneFoto) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      advertenciaPedido =
        "Cliente creado, pero tu sesión expiró antes de subir la foto del pedido.";
    } else {
      const foto = fotoPedido as File;
      const extension = foto.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("pedidos")
        .upload(path, foto, { contentType: foto.type });

      if (uploadError) {
        advertenciaPedido = `Cliente creado, pero no se pudo subir la foto del pedido: ${uploadError.message}`;
      } else {
        const { error: pedidoError } = await supabase.from("pedidos").insert({
          cliente_id: cliente.id,
          foto_url: path,
          monto: montoPedido,
          fecha_compra: new Date().toISOString().slice(0, 10),
        });

        if (pedidoError) {
          await supabase.storage.from("pedidos").remove([path]);
          advertenciaPedido = `Cliente creado, pero no se pudo registrar el pedido: ${pedidoError.message}`;
        } else {
          huboPedido = true;
          revalidatePath("/pedidos");
        }
      }
    }
  }

  const fechaRecordatorio = new Date();
  fechaRecordatorio.setDate(fechaRecordatorio.getDate() + DIAS_RECORDATORIO_POSVENTA);

  const { error: seguimientoError } = await supabase.from("seguimientos").insert({
    cliente_id: cliente.id,
    etapa,
    proxima_accion:
      proxima_accion || (huboPedido ? "Preguntar cómo le quedó el pedido" : null),
    proxima_accion_fecha:
      proxima_accion_fecha ||
      (huboPedido ? fechaRecordatorio.toISOString().slice(0, 10) : null),
    notas: notas || null,
  });

  revalidatePath("/clientes");
  revalidatePath("/dashboard");

  if (seguimientoError) {
    return {
      data: cliente,
      error: `Cliente creado, pero no se pudo registrar el primer seguimiento: ${seguimientoError.message}`,
    };
  }

  if (advertenciaPedido) {
    return { data: cliente, error: advertenciaPedido };
  }

  return { data: cliente, error: null };
}
