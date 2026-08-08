"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getClienteConEtapa, getHistorialCliente } from "@/lib/data/clientes";
import { getCotizaciones } from "@/lib/data/cotizaciones";
import { getPedidos } from "@/lib/data/pedidos";
import { getMensajesWhatsapp } from "@/lib/data/whatsapp";
import { sugerirRespuestaWhatsapp } from "@/lib/claude/whatsapp";
import { buscarConocimientoRelevante } from "@/lib/services/conocimiento.service";
import type { ActionResult } from "@/lib/action-result";
import type { MensajeWhatsapp } from "@/lib/types";

export async function actionSugerirRespuestaWhatsapp(
  clienteId: string
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
      fragmentos
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
