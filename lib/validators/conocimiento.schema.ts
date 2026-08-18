import { z } from "zod";

export const SECCIONES = [
  "catalogo",
  "preguntas_frecuentes",
  "garantias",
  "tono",
  "promociones",
  "datos_empresa",
] as const;

export const GuardarSeccionConocimientoSchema = z.object({
  seccion: z.enum(SECCIONES),
  contenido: z.string().trim(),
});

export type GuardarSeccionConocimientoInput = z.infer<
  typeof GuardarSeccionConocimientoSchema
>;
