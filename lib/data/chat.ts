import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, InfoNegocio } from "@/lib/types";

type DB = SupabaseClient<Database>;

/**
 * Tabla legacy reemplazada por conocimiento_negocio (ver
 * lib/data/conocimiento.ts). Se mantiene solo para que /conocimiento
 * pueda mostrarle a Edwin el aviso de "tenías esto guardado antes" si
 * migró desde la Configuración vieja.
 */
export const getInfoNegocio = cache(async function getInfoNegocio(
  supabase: DB
): Promise<InfoNegocio | null> {
  const { data, error } = await supabase.from("info_negocio").select("*").maybeSingle();

  if (error) {
    console.error("getInfoNegocio:", error.message);
    return null;
  }
  return data;
});
