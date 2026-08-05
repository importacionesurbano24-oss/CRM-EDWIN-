import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Pedido } from "@/lib/types";

type DB = SupabaseClient<Database>;

const URL_EXPIRA_SEGUNDOS = 60 * 60; // 1 hora, suficiente para una vista de página

export interface PedidoConDetalle extends Pedido {
  clienteNombre: string;
  fotoSignedUrl: string | null;
}

export const getPedidos = cache(async function getPedidos(
  supabase: DB
): Promise<PedidoConDetalle[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*, clientes(nombre)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPedidos:", error.message);
    return [];
  }

  const pedidos = data ?? [];

  const conFoto = await Promise.all(
    pedidos.map(async (row) => {
      const { clientes, ...pedido } = row as Pedido & {
        clientes: { nombre: string } | null;
      };

      const { data: firmada } = await supabase.storage
        .from("pedidos")
        .createSignedUrl(pedido.foto_url, URL_EXPIRA_SEGUNDOS);

      return {
        ...pedido,
        clienteNombre: clientes?.nombre ?? "Cliente",
        fotoSignedUrl: firmada?.signedUrl ?? null,
      };
    })
  );

  return conFoto;
});
