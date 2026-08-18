"use server";

import { createClient } from "@/lib/supabase/server";
import { getConocimientoNegocio } from "@/lib/data/conocimiento";
import { excelATexto } from "@/lib/files/excel";
import { analizarCargaMasiva, type ContenidoArchivo } from "@/lib/claude/carga-masiva";
import { AnalizarCargaMasivaSchema } from "@/lib/validators/carga-masiva.schema";
import type { ActionResult } from "@/lib/action-result";

export interface AnalisisCargaMasivaResult {
  catalogoPropuesto: string;
  resumen: string;
  productosNuevos: number;
  productosActualizados: number;
}

// Clave en Supabase Storage donde se guarda el último análisis procesado.
// Así la próxima carga del mismo archivo no gasta tokens del PDF.
const CACHE_BUCKET = "conocimiento";
const CACHE_KEY = (userId: string) => `cache/${userId}/ultimo-analisis.json`;

export async function actionAnalizarCargaMasiva(
  formData: FormData
): Promise<ActionResult<AnalisisCargaMasivaResult>> {
  const parsed = AnalizarCargaMasivaSchema.safeParse({
    archivo: formData.get("archivo"),
    instruccion: formData.get("instruccion"),
    nivel: formData.get("nivel") || undefined,
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const { archivo, instruccion, nivel } = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "No autenticado." };
  }

  const filas = await getConocimientoNegocio(supabase);
  const catalogoActual = filas.find((f) => f.seccion === "catalogo")?.contenido ?? "";

  // ── Convertir archivo al formato interno ──────────────────────────────────
  const arrayBuffer = await archivo.arrayBuffer();
  let contenidoArchivo: ContenidoArchivo;

  if (archivo.type === "application/pdf") {
    contenidoArchivo = { tipo: "pdf", base64: Buffer.from(arrayBuffer).toString("base64") };
  } else if (archivo.type.startsWith("image/")) {
    contenidoArchivo = {
      tipo: "imagen",
      mediaType: archivo.type as "image/jpeg" | "image/png" | "image/webp",
      base64: Buffer.from(arrayBuffer).toString("base64"),
    };
  } else if (
    archivo.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    /\.xlsx$/i.test(archivo.name)
  ) {
    contenidoArchivo = { tipo: "texto", texto: await excelATexto(arrayBuffer) };
  } else {
    contenidoArchivo = { tipo: "texto", texto: Buffer.from(arrayBuffer).toString("utf-8") };
  }

  try {
    // ── Llamar a Claude (1 sola vez por archivo) ──────────────────────────
    const analisis = await analizarCargaMasiva({
      catalogoActual,
      instruccion,
      archivo: contenidoArchivo,
      nivel,
    });

    // ── Guardar resultado en Supabase Storage (0 tokens la próxima vez) ───
    // Si el bucket no existe, créalo manualmente en el dashboard de Supabase
    // con nombre "conocimiento" y acceso privado.
    const cachePayload = JSON.stringify({
      ...analisis,
      archivoNombre: archivo.name,
      archivoTipo: archivo.type,
      instruccion,
      guardadoEn: new Date().toISOString(),
    });

    await supabase.storage
      .from(CACHE_BUCKET)
      .upload(CACHE_KEY(user.id), Buffer.from(cachePayload), {
        contentType: "application/json",
        upsert: true, // sobreescribe el anterior
      });

    return {
      data: {
        catalogoPropuesto: analisis.catalogo_actualizado,
        resumen: analisis.resumen_cambios,
        productosNuevos: analisis.productos_nuevos,
        productosActualizados: analisis.productos_actualizados,
      },
      error: null,
    };
  } catch (error) {
    console.error("actionAnalizarCargaMasiva:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "No se pudo analizar el archivo.",
    };
  }
}

// ── Action separado para leer el último análisis cacheado ─────────────────
// Úsalo para mostrar un preview del último resultado sin volver a gastar tokens.
export async function actionLeerUltimoAnalisis(): Promise<
  ActionResult<AnalisisCargaMasivaResult & { archivoNombre: string; guardadoEn: string }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "No autenticado." };

  const { data, error } = await supabase.storage
    .from(CACHE_BUCKET)
    .download(CACHE_KEY(user.id));

  if (error || !data) {
    return { data: null, error: "No hay análisis previo guardado." };
  }

  try {
    const texto = await data.text();
    const json = JSON.parse(texto);
    return {
      data: {
        catalogoPropuesto: json.catalogo_actualizado,
        resumen: json.resumen_cambios,
        productosNuevos: json.productos_nuevos,
        productosActualizados: json.productos_actualizados,
        archivoNombre: json.archivoNombre,
        guardadoEn: json.guardadoEn,
      },
      error: null,
    };
  } catch {
    return { data: null, error: "El análisis guardado está corrupto." };
  }
}