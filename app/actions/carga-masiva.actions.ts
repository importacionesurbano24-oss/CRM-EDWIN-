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

export async function actionAnalizarCargaMasiva(
  formData: FormData
): Promise<ActionResult<AnalisisCargaMasivaResult>> {
  const parsed = AnalizarCargaMasivaSchema.safeParse({
    archivo: formData.get("archivo"),
    instruccion: formData.get("instruccion"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const { archivo, instruccion } = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "No autenticado." };
  }

  const filas = await getConocimientoNegocio(supabase);
  const catalogoActual = filas.find((f) => f.seccion === "catalogo")?.contenido ?? "";

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
    const analisis = await analizarCargaMasiva({
      catalogoActual,
      instruccion,
      archivo: contenidoArchivo,
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
