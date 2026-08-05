import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Cotizacion } from "@/lib/types";

type DB = SupabaseClient<Database>;

export interface CotizacionConCliente extends Cotizacion {
  clienteNombre: string;
}

export const getCotizaciones = cache(async function getCotizaciones(
  supabase: DB
): Promise<CotizacionConCliente[]> {
  const { data, error } = await supabase
    .from("cotizaciones")
    .select("*, clientes(nombre)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getCotizaciones:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const { clientes, ...cotizacion } = row as Cotizacion & {
      clientes: { nombre: string } | null;
    };
    return { ...cotizacion, clienteNombre: clientes?.nombre ?? "Cliente" };
  });
});

/** Solo para la página pública — usa el cliente de service_role (ver lib/supabase/service.ts). */
export const getCotizacionPorToken = cache(async function getCotizacionPorToken(
  serviceClient: DB,
  token: string
): Promise<(Cotizacion & { clienteNombre: string }) | null> {
  const { data, error } = await serviceClient
    .from("cotizaciones")
    .select("*, clientes(nombre)")
    .eq("token_publico", token)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getCotizacionPorToken:", error.message);
    return null;
  }

  const { clientes, ...cotizacion } = data as Cotizacion & {
    clientes: { nombre: string } | null;
  };
  return { ...cotizacion, clienteNombre: clientes?.nombre ?? "Cliente" };
});

/** Marca vista_en la primera vez que el cliente abre el link. No pisa una fecha ya guardada. */
export async function marcarVistaSiCorresponde(
  serviceClient: DB,
  cotizacion: Cotizacion
): Promise<void> {
  if (cotizacion.vista_en || cotizacion.estado === "aceptada") return;

  const { error } = await serviceClient
    .from("cotizaciones")
    .update({ estado: "vista", vista_en: new Date().toISOString() })
    .eq("id", cotizacion.id);

  if (error) console.error("marcarVistaSiCorresponde:", error.message);
}
