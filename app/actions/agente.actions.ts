"use server";

import { createClient } from "@/lib/supabase/server";
import { getClienteConEtapa, getHistorialCliente } from "@/lib/data/clientes";
import { getCotizaciones } from "@/lib/data/cotizaciones";
import { getPedidos } from "@/lib/data/pedidos";
import { getMensajesWhatsapp } from "@/lib/data/whatsapp";
import { sugerirProximaAccion, type Sugerencia } from "@/lib/claude/agente";
import { leerContenidoUrl } from "@/lib/utils/leer-url";
import type { ActionResult } from "@/lib/action-result";
import type { NivelIA } from "@/lib/claude/modelos";

export async function actionSugerirProximaAccion(
  clienteId: string,
  nivel?: NivelIA
): Promise<ActionResult<Sugerencia>> {
  const supabase = await createClient();

  const [cliente, historial, cotizaciones, pedidos, mensajesWhatsapp] = await Promise.all([
    getClienteConEtapa(supabase, clienteId),
    getHistorialCliente(supabase, clienteId),
    getCotizaciones(supabase),
    getPedidos(supabase),
    getMensajesWhatsapp(supabase, clienteId),
  ]);

  if (!cliente) {
    return { data: null, error: "Cliente no encontrado." };
  }

  const linkMasReciente = historial.find((h) => h.link_cotizacion)?.link_cotizacion;
  const cotizacionExterna = linkMasReciente
    ? { url: linkMasReciente, contenido: await leerContenidoUrl(linkMasReciente) }
    : null;

  try {
    const sugerencia = await sugerirProximaAccion(
      {
        cliente,
        historial,
        cotizaciones: cotizaciones.filter((c) => c.cliente_id === clienteId),
        pedidos: pedidos.filter((p) => p.cliente_id === clienteId),
        cotizacionExterna,
        mensajesWhatsapp,
      },
      nivel
    );
    return { data: sugerencia, error: null };
  } catch (error) {
    console.error("actionSugerirProximaAccion:", error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo generar la sugerencia.",
    };
  }
}
