import { z } from "zod";

export const EnviarMensajeEntrenamientoSchema = z.object({
  clienteId: z.string().uuid().nullable(),
  mensaje: z.string().trim().min(1, "Escribe un mensaje."),
  systemPrompt: z.string().trim().min(1, "El system prompt no puede estar vacío."),
  modoModelo: z.enum(["basico", "avanzado", "auto"]),
  useRag: z.boolean(),
  /** URL de referencia ya leída (ver actionLeerUrlEntrenamiento) — se
   * manda el texto ya extraído, no la URL sola, para no releerla en
   * cada mensaje de la conversación. nullish (no solo nullable) para que
   * un cliente con un bundle viejo, que todavía no manda estos campos,
   * no rompa la validación — sin URL cargada es un caso válido. */
  urlReferencia: z.string().nullish(),
  contenidoUrlReferencia: z.string().nullish(),
});

export type EnviarMensajeEntrenamientoInput = z.infer<
  typeof EnviarMensajeEntrenamientoSchema
>;

export const LeerUrlEntrenamientoSchema = z.object({
  url: z.string().trim().url("Pegá una URL válida (con https://)."),
});

export type LeerUrlEntrenamientoInput = z.infer<typeof LeerUrlEntrenamientoSchema>;

export const GuardarPromptActivoSchema = z.object({
  name: z.string().trim().min(1, "Falta el nombre de esta versión."),
  systemPrompt: z.string().trim().min(1, "El system prompt no puede estar vacío."),
  nivelIa: z.enum(["basico", "avanzado"]),
  useRag: z.boolean(),
});

export type GuardarPromptActivoInput = z.infer<typeof GuardarPromptActivoSchema>;
