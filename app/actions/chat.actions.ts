"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getClienteConEtapa, getHistorialCliente, getClientesConEtapa } from "@/lib/data/clientes";
import { getCotizaciones } from "@/lib/data/cotizaciones";
import { getPedidos } from "@/lib/data/pedidos";
import { getMensajesWhatsapp } from "@/lib/data/whatsapp";
import { getPedidosReporte } from "@/lib/data/reportes";
import { responderChat, type MensajeConversacion } from "@/lib/claude/chat";
import { buscarConocimientoRelevante } from "@/lib/services/conocimiento.service";
import {
  construirContextoCliente,
  construirContextoNegocio,
} from "@/lib/services/chatContexto.service";
import { EnviarMensajeSchema } from "@/lib/validators/chat.schema";
import type { ActionResult } from "@/lib/action-result";
import type { MensajeChat } from "@/lib/types";
import type { NivelIA } from "@/lib/claude/modelos";

export async function actionEnviarMensajeChat(
  clienteId: string | null,
  mensaje: string,
  nivel: NivelIA | undefined,
  /** Turnos previos de ESTA sesión de chat (lo que ya está en pantalla) — el
   * cliente los manda porque ya no se guarda/relee un historial persistente;
   * cada apertura del chat arranca en blanco. */
  historialPrevio: MensajeConversacion[]
): Promise<ActionResult<MensajeChat>> {
  const parsed = EnviarMensajeSchema.safeParse({ clienteId, mensaje });
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const fragmentos = await buscarConocimientoRelevante(supabase, parsed.data.mensaje);

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
    const [cliente, historialCliente, cotizaciones, pedidos, mensajesWhatsapp] = await Promise.all([
      getClienteConEtapa(supabase, parsed.data.clienteId),
      getHistorialCliente(supabase, parsed.data.clienteId),
      getCotizaciones(supabase),
      getPedidos(supabase),
      getMensajesWhatsapp(supabase, parsed.data.clienteId),
    ]);

    if (!cliente) {
      return { data: mensajeUsuario, error: "Cliente no encontrado." };
    }

    contextoEspecifico = construirContextoCliente({
      cliente,
      historial: historialCliente,
      cotizaciones: cotizaciones.filter((c) => c.cliente_id === parsed.data.clienteId),
      pedidos: pedidos.filter((p) => p.cliente_id === parsed.data.clienteId),
      mensajesWhatsapp,
    });
  } else {
    const [clientes, pedidosReporte] = await Promise.all([
      getClientesConEtapa(supabase),
      getPedidosReporte(supabase),
    ]);
    contextoEspecifico = construirContextoNegocio(clientes, pedidosReporte);
  }

  const historialCompleto: MensajeConversacion[] = [
    ...historialPrevio,
    { rol: "user", mensaje: parsed.data.mensaje },
  ];

  try {
    const respuesta = await responderChat(
      historialCompleto,
      contextoEspecifico,
      fragmentos,
      nivel
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
