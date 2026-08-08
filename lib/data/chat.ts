import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MensajeChat, InfoNegocio } from "@/lib/types";

type DB = SupabaseClient<Database>;

/**
 * Últimos `limite` mensajes de un hilo (el de un cliente si se pasa
 * clienteId, o el chat general del negocio si es null), en orden
 * cronológico para mostrar. Se pide descendente + limit y se invierte, para
 * traer los MÁS RECIENTES `limite` mensajes, no los más viejos.
 */
export const getHistorialChat = cache(async function getHistorialChat(
  supabase: DB,
  clienteId: string | null,
  limite = 50
): Promise<MensajeChat[]> {
  let query = supabase
    .from("chat_agente")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);

  query = clienteId ? query.eq("cliente_id", clienteId) : query.is("cliente_id", null);

  const { data, error } = await query;

  if (error) {
    console.error("getHistorialChat:", error.message);
    return [];
  }
  return (data ?? []).reverse();
});

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
