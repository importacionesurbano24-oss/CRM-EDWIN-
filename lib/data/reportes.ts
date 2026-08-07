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
