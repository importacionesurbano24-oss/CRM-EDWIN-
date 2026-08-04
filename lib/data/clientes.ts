import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ClienteConEtapa, Seguimiento } from "@/lib/types";

type DB = SupabaseClient<Database>;

// Envueltas en cache(): dentro de un mismo request, layout.tsx (contador del
// sidebar) y la página correspondiente piden lo mismo sin duplicar la consulta.

export const getClientesConEtapa = cache(async function getClientesConEtapa(
  supabase: DB
): Promise<ClienteConEtapa[]> {
  const { data, error } = await supabase
    .from("clientes_con_etapa")
    .select("*")
    .order("proxima_accion_fecha", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("getClientesConEtapa:", error.message);
    return [];
  }
  return data ?? [];
});

export const getClienteConEtapa = cache(async function getClienteConEtapa(
  supabase: DB,
  id: string
): Promise<ClienteConEtapa | null> {
  const { data, error } = await supabase
    .from("clientes_con_etapa")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getClienteConEtapa:", error.message);
    return null;
  }
  return data;
});

export const getHistorialCliente = cache(async function getHistorialCliente(
  supabase: DB,
  clienteId: string
): Promise<Seguimiento[]> {
  const { data, error } = await supabase
    .from("seguimientos")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getHistorialCliente:", error.message);
    return [];
  }
  return data ?? [];
});

export interface ActividadReciente {
  id: string;
  clienteId: string;
  clienteNombre: string;
  etapa: Seguimiento["etapa"];
  createdAt: string;
}

export const getActividadReciente = cache(async function getActividadReciente(
  supabase: DB,
  limite = 6
): Promise<ActividadReciente[]> {
  const { data, error } = await supabase
    .from("seguimientos")
    .select("id, cliente_id, etapa, created_at, clientes(nombre)")
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("getActividadReciente:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    clienteId: row.cliente_id,
    clienteNombre:
      (row.clientes as unknown as { nombre: string } | null)?.nombre ??
      "Cliente",
    etapa: row.etapa,
    createdAt: row.created_at,
  }));
});
