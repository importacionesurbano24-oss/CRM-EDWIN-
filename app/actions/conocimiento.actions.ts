"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generarEmbedding } from "@/lib/claude/embeddings";
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

  revalidatePath("/conocimiento");
  return {
    data: { fila: data, embeddingGenerado: embedding !== null },
    error: null,
  };
}
