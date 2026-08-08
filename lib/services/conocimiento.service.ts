import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SeccionConocimiento } from "@/lib/types";
import { generarEmbedding } from "@/lib/claude/embeddings";

type DB = SupabaseClient<Database>;

export interface FragmentoConocimiento {
  seccion: SeccionConocimiento;
  contenido: string;
  similarity: number;
}

/**
 * Trae las secciones de conocimiento más relevantes para `consulta` vía el
 * RPC de pgvector (buscar_conocimiento, migración 0007). Si falta
 * VOYAGE_API_KEY o algo falla, devuelve [] — los chats siguen respondiendo
 * sin RAG, solo con su contexto normal.
 */
export async function buscarConocimientoRelevante(
  supabase: DB,
  consulta: string,
  matchCount = 4
): Promise<FragmentoConocimiento[]> {
  const embedding = await generarEmbedding(consulta, "query");
  if (!embedding) return [];

  const { data, error } = await supabase.rpc("buscar_conocimiento", {
    query_embedding: JSON.stringify(embedding),
    match_count: matchCount,
  });

  if (error) {
    console.error("buscarConocimientoRelevante:", error.message);
    return [];
  }
  return data ?? [];
}
