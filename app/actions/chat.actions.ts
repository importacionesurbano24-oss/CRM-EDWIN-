"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHistorialChat, getInfoNegocio } from "@/lib/data/chat";
import { getClienteConEtapa, getHistorialCliente, getClientesConEtapa } from "@/lib/data/clientes";
import { getCotizaciones } from "@/lib/data/cotizaciones";
import { getPedidos } from "@/lib/data/pedidos";
import { getPedidosReporte } from "@/lib/data/reportes";
import { responderChat, type MensajeConversacion } from "@/lib/claude/chat";
import {
  construirContextoCliente,
  construirContextoNegocio,
} from "@/lib/services/chatContexto.service";
import { EnviarMensajeSchema, GuardarInfoNegocioSchema } from "@/lib/validators/chat.schema";
import type { ActionResult } from "@/lib/action-result";
import type { MensajeChat, InfoNegocio } from "@/lib/types";

export async function actionEnviarMensajeChat(
  clienteId: string | null,
  mensaje: string
): Promise<ActionResult<MensajeChat>> {
  const parsed = EnviarMensajeSchema.safeParse({ clienteId, mensaje });
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const historialPrevio = await getHistorialChat(supabase, parsed.data.clienteId);
  const infoNegocio = await getInfoNegocio(supabase);

  const { data: mensajeUsuario, error: errorInsert } = await supabase
    .from("chat_agente")
    .insert({
      cliente_id: parsed.data.clienteId,
      rol: "user",
      mensaje: parsed.data.mensaje,
    })
    .select()
    .single();

  if (errorInsert || !mensajeUsuario) {
    return {
      data: null,
      error: errorInsert?.message ?? "No se pudo guardar el mensaje.",
    };
  }

  let contextoEspecifico: string;
  if (parsed.data.clienteId) {
    const [cliente, historialCliente, cotizaciones, pedidos] = await Promise.all([
      getClienteConEtapa(supabase, parsed.data.clienteId),
      getHistorialCliente(supabase, parsed.data.clienteId),
      getCotizaciones(supabase),
      getPedidos(supabase),
    ]);

    if (!cliente) {
      return { data: mensajeUsuario, error: "Cliente no encontrado." };
    }

    contextoEspecifico = construirContextoCliente({
      cliente,
      historial: historialCliente,
      cotizaciones: cotizaciones.filter((c) => c.cliente_id === parsed.data.clienteId),
      pedidos: pedidos.filter((p) => p.cliente_id === parsed.data.clienteId),
    });
  } else {
    const [clientes, pedidosReporte] = await Promise.all([
      getClientesConEtapa(supabase),
      getPedidosReporte(supabase),
    ]);
    contextoEspecifico = construirContextoNegocio(clientes, pedidosReporte);
  }

  const historialCompleto: MensajeConversacion[] = [
    ...historialPrevio.map((m) => ({ rol: m.rol, mensaje: m.mensaje })),
    { rol: "user", mensaje: parsed.data.mensaje },
  ];

  try {
    const respuesta = await responderChat(
      historialCompleto,
      contextoEspecifico,
      infoNegocio?.contenido || null
    );

    const { data: mensajeAsistente, error: errorAsistente } = await supabase
      .from("chat_agente")
      .insert({
        cliente_id: parsed.data.clienteId,
        rol: "assistant",
        mensaje: respuesta,
      })
      .select()
      .single();

    if (errorAsistente || !mensajeAsistente) {
      return {
        data: mensajeUsuario,
        error: errorAsistente?.message ?? "No se pudo guardar la respuesta.",
      };
    }

    if (parsed.data.clienteId) {
      revalidatePath(`/clientes/${parsed.data.clienteId}`);
    } else {
      revalidatePath("/dashboard");
    }

    return { data: mensajeAsistente, error: null };
  } catch (error) {
    console.error("actionEnviarMensajeChat:", error);
    return {
      data: mensajeUsuario,
      error: error instanceof Error ? error.message : "No se pudo generar la respuesta.",
    };
  }
}

export async function actionGuardarInfoNegocio(
  formData: FormData
): Promise<ActionResult<InfoNegocio>> {
  const parsed = GuardarInfoNegocioSchema.safeParse({
    contenido: formData.get("contenido"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "No autenticado." };
  }

  const { data, error } = await supabase
    .from("info_negocio")
    .upsert(
      {
        user_id: user.id,
        contenido: parsed.data.contenido,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error || !data) {
    return { data: null, error: error?.message ?? "No se pudo guardar." };
  }

  revalidatePath("/configuracion");
  return { data, error: null };
}
