"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generarEmbedding } from "@/lib/claude/embeddings";
import { leerContenidoUrl } from "@/lib/utils/leer-url";
import { GuardarSeccionConocimientoSchema } from "@/lib/validators/conocimiento.schema";
import type { ActionResult } from "@/lib/action-result";
import type { ConocimientoNegocio } from "@/lib/types";

export interface GuardarSeccionResult {
  fila: ConocimientoNegocio;
  embeddingGenerado: boolean;
}

export async function actionGuardarSeccionConocimiento(
  formData: FormData
): Promise<ActionResult<GuardarSeccionResult>> {
  const parsed = GuardarSeccionConocimientoSchema.safeParse({
    seccion: formData.get("seccion"),
    contenido: formData.get("contenido"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "No autenticado." };
  }

  const embedding = await generarEmbedding(parsed.data.contenido, "document");

  const { data, error } = await supabase
    .from("conocimiento_negocio")
    .upsert(
      {
        user_id: user.id,
        seccion: parsed.data.seccion,
        contenido: parsed.data.contenido,
        embedding: embedding ? JSON.stringify(embedding) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,seccion" }
    )
    .select()
    .single();

  if (error || !data) {
    return { data: null, error: error?.message ?? "No se pudo guardar." };
  }

  // /conocimiento ahora es un redirect a /agente (se unió con
  // /entrenamiento en pestañas) — revalidar la ruta vieja ya no hace nada.
  revalidatePath("/agente");
  return {
    data: { fila: data, embeddingGenerado: embedding !== null },
    error: null,
  };
}

const LeerUrlSitioSchema = z.object({
  url: z.string().trim().url("Pegá una URL válida (con https://)."),
});

/**
 * Lee el sitio web del negocio para agregarlo a "Datos de la empresa".
 * Reutiliza leerContenidoUrl (lib/utils/leer-url), la misma función que
 * ya usan agente.ts (cotización externa) y el sandbox de /agente — no
 * duplica la lógica de descarga/extracción de texto. Solo devuelve el
 * texto leído; Edwin decide si lo agrega al textarea y lo guarda.
 */
export async function actionLeerUrlConocimiento(
  url: string
): Promise<ActionResult<{ url: string; contenido: string }>> {
  const parsed = LeerUrlSitioSchema.safeParse({ url });
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const contenido = await leerContenidoUrl(parsed.data.url);

  return { data: { url: parsed.data.url, contenido }, error: null };
}
