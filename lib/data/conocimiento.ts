import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ConocimientoNegocio } from "@/lib/types";

type DB = SupabaseClient<Database>;

export const getConocimientoNegocio = cache(async function getConocimientoNegocio(
  supabase: DB
): Promise<ConocimientoNegocio[]> {
  const { data, error } = await supabase.from("conocimiento_negocio").select("*");

  if (error) {
    console.error("getConocimientoNegocio:", error.message);
    return [];
  }
  return data ?? [];
});
