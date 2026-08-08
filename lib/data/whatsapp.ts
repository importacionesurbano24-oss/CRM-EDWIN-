import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MensajeWhatsapp, DireccionMensaje } from "@/lib/types";

type DB = SupabaseClient<Database>;

export const getMensajesWhatsapp = cache(async function getMensajesWhatsapp(
  supabase: DB,
  clienteId: string
): Promise<MensajeWhatsapp[]> {
  const { data, error } = await supabase
    .from("mensajes_whatsapp")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getMensajesWhatsapp:", error.message);
    return [];
  }
  return data ?? [];
});

export interface UltimoMensajeWhatsapp {
  clienteId: string;
  clienteNombre: string;
  direccion: DireccionMensaje;
  contenido: string;
  createdAt: string;
}

/** El mensaje más reciente por cliente — sirve para saber a quién le toca responder. */
export const getUltimosMensajesPorCliente = cache(
  async function getUltimosMensajesPorCliente(
    supabase: DB
  ): Promise<UltimoMensajeWhatsapp[]> {
    const { data, error } = await supabase
      .from("mensajes_whatsapp")
      .select("cliente_id, direccion, contenido, created_at, clientes(nombre)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getUltimosMensajesPorCliente:", error.message);
      return [];
    }

    const vistos = new Set<string>();
    const resultado: UltimoMensajeWhatsapp[] = [];
    for (const fila of data ?? []) {
      if (vistos.has(fila.cliente_id)) continue;
      vistos.add(fila.cliente_id);
      resultado.push({
        clienteId: fila.cliente_id,
        clienteNombre:
          (fila.clientes as unknown as { nombre: string } | null)?.nombre ?? "Cliente",
        direccion: fila.direccion,
        contenido: fila.contenido,
        createdAt: fila.created_at,
      });
    }
    return resultado;
  }
);
