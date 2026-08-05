"use server";

import { createClient } from "@/lib/supabase/server";
import { getClienteConEtapa, getHistorialCliente } from "@/lib/data/clientes";
import { getCotizaciones } from "@/lib/data/cotizaciones";
import { getPedidos } from "@/lib/data/pedidos";
import { sugerirProximaAccion, type Sugerencia } from "@/lib/claude/agente";
import type { ActionResult } from "@/lib/action-result";

export async function actionSugerirProximaAccion(
  clienteId: string
): Promise<ActionResult<Sugerencia>> {
  const supabase = await createClient();

  const [cliente, historial, cotizaciones, pedidos] = await Promise.all([
    getClienteConEtapa(supabase, clienteId),
    getHistorialCliente(supabase, clienteId),
    getCotizaciones(supabase),
    getPedidos(supabase),
  ]);

  if (!cliente) {
    return { data: null, error: "Cliente no encontrado." };
  }

  try {
    const sugerencia = await sugerirProximaAccion({
      cliente,
      historial,
      cotizaciones: cotizaciones.filter((c) => c.cliente_id === clienteId),
      pedidos: pedidos.filter((p) => p.cliente_id === clienteId),
    });
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
