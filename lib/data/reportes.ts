import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

type DB = SupabaseClient<Database>;

export interface PedidoReporte {
  id: string;
  monto: number;
  fecha_compra: string;
  created_at: string;
}

/**
 * Versión liviana de getPedidos (lib/data/pedidos.ts) solo con los campos
 * que necesitan los gráficos — evita pedir la URL firmada de cada foto,
 * que no aporta nada a un conteo por fecha.
 */
export const getPedidosReporte = cache(async function getPedidosReporte(
  supabase: DB
): Promise<PedidoReporte[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("id, monto, fecha_compra, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPedidosReporte:", error.message);
    return [];
  }
  return data ?? [];
});

export interface CotizacionReporte {
  id: string;
  cliente_id: string;
  monto_total: number;
  estado: string;
  created_at: string;
}

/** Versión liviana de getCotizaciones (lib/data/cotizaciones.ts) — sin el
 * join a clientes, que el panel de informes no necesita. */
export const getCotizacionesReporte = cache(async function getCotizacionesReporte(
  supabase: DB
): Promise<CotizacionReporte[]> {
  const { data, error } = await supabase
    .from("cotizaciones")
    .select("id, cliente_id, monto_total, estado, created_at");

  if (error) {
    console.error("getCotizacionesReporte:", error.message);
    return [];
  }
  return data ?? [];
});

export interface MensajeWhatsappReporte {
  direccion: string;
  generado_por_agente: boolean;
  created_at: string;
}

/** Solo los campos que necesita "Rendimiento del agente IA" — sin el
 * contenido del mensaje ni el join a clientes. */
export const getMensajesWhatsappReporte = cache(async function getMensajesWhatsappReporte(
  supabase: DB
): Promise<MensajeWhatsappReporte[]> {
  const { data, error } = await supabase
    .from("mensajes_whatsapp")
    .select("direccion, generado_por_agente, created_at");

  if (error) {
    console.error("getMensajesWhatsappReporte:", error.message);
    return [];
  }
  return data ?? [];
});
