"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getClienteConEtapa, getHistorialCliente } from "@/lib/data/clientes";
import { getCotizaciones } from "@/lib/data/cotizaciones";
import { getPedidos } from "@/lib/data/pedidos";
import { getMensajesWhatsapp } from "@/lib/data/whatsapp";
import { sugerirRespuestaWhatsapp } from "@/lib/claude/whatsapp";
import { buscarConocimientoRelevante } from "@/lib/services/conocimiento.service";
import { enviarMensajeWhatsapp } from "@/lib/whatsapp/enviar";
import { dentroDeVentana24h } from "@/lib/whatsapp/ventana";
import { EnviarWhatsappSchema } from "@/lib/validators/whatsapp.schema";
import type { ActionResult } from "@/lib/action-result";
import type { MensajeWhatsapp } from "@/lib/types";
import type { NivelIA } from "@/lib/claude/modelos";

export async function actionSugerirRespuestaWhatsapp(
  clienteId: string,
  nivel?: NivelIA
): Promise<ActionResult<string>> {
  const supabase = await createClient();

  const [cliente, historial, cotizaciones, pedidos, hilo] = await Promise.all([
    getClienteConEtapa(supabase, clienteId),
    getHistorialCliente(supabase, clienteId),
    getCotizaciones(supabase),
    getPedidos(supabase),
    getMensajesWhatsapp(supabase, clienteId),
  ]);

  if (!cliente) {
    return { data: null, error: "Cliente no encontrado." };
  }

  const ultimoEntrante = [...hilo].reverse().find((m) => m.direccion === "entrante");
  const fragmentos = ultimoEntrante
    ? await buscarConocimientoRelevante(supabase, ultimoEntrante.contenido)
    : [];

  try {
    const sugerencia = await sugerirRespuestaWhatsapp(
      {
        cliente,
        historial,
        cotizaciones: cotizaciones.filter((c) => c.cliente_id === clienteId),
        pedidos: pedidos.filter((p) => p.cliente_id === clienteId),
      },
      hilo,
      fragmentos,
      nivel
    );
    return { data: sugerencia, error: null };
  } catch (error) {
    console.error("actionSugerirRespuestaWhatsapp:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "No se pudo generar la sugerencia.",
    };
  }
}

/** Edwin copió la sugerencia y ya la mandó desde su WhatsApp — se guarda como saliente. */
export async function actionMarcarWhatsappEnviado(
  clienteId: string,
  contenido: string
): Promise<ActionResult<MensajeWhatsapp>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "No autenticado." };
  }

  const { data, error } = await supabase
    .from("mensajes_whatsapp")
    .insert({
      user_id: user.id,
      cliente_id: clienteId,
      direccion: "saliente",
      contenido,
      generado_por_agente: true,
    })
    .select()
    .single();

  if (error || !data) {
    return { data: null, error: error?.message ?? "No se pudo registrar el mensaje." };
  }

  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/tareas");
  revalidatePath("/dashboard");

  return { data, error: null };
}

/** Manda el mensaje de verdad por la Cloud API de Meta y lo registra como saliente. */
export async function actionEnviarWhatsapp(
  clienteId: string,
  contenido: string
): Promise<ActionResult<MensajeWhatsapp>> {
  const parsed = EnviarWhatsappSchema.safeParse({ contenido });
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

  const [cliente, hilo] = await Promise.all([
    getClienteConEtapa(supabase, clienteId),
    getMensajesWhatsapp(supabase, clienteId),
  ]);

  if (!cliente) {
    return { data: null, error: "Cliente no encontrado." };
  }
  if (!cliente.telefono_whatsapp) {
    return { data: null, error: "Este cliente no tiene número de WhatsApp registrado." };
  }
  if (!dentroDeVentana24h(hilo)) {
    return {
      data: null,
      error:
        "Han pasado más de 24h desde el último mensaje del cliente — WhatsApp ya no permite mensajes libres. Pídele que te escriba primero, o márcalo como enviado manualmente si ya lo contactaste por otro medio.",
    };
  }

  const envio = await enviarMensajeWhatsapp(cliente.telefono_whatsapp, parsed.data.contenido);
  if (!envio.ok) {
    return { data: null, error: envio.error };
  }

  const { data, error } = await supabase
    .from("mensajes_whatsapp")
    .insert({
      user_id: user.id,
      cliente_id: clienteId,
      direccion: "saliente",
      contenido: parsed.data.contenido,
      generado_por_agente: true,
      whatsapp_message_id: envio.messageId || null,
    })
    .select()
    .single();

  if (error || !data) {
    return {
      data: null,
      error: error?.message ?? "Se envió, pero no se pudo registrar en el CRM.",
    };
  }

  revalidatePath("/whatsapp");
  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/tareas");
  revalidatePath("/dashboard");

  return { data, error: null };
}
