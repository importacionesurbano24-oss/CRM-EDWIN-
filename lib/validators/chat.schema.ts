import { z } from "zod";

export const EnviarMensajeSchema = z.object({
  clienteId: z.string().uuid().nullable(),
  mensaje: z.string().trim().min(1, "Escribe un mensaje."),
});

export type EnviarMensajeInput = z.infer<typeof EnviarMensajeSchema>;

export const GuardarInfoNegocioSchema = z.object({
  contenido: z.string().trim(),
});

export type GuardarInfoNegocioInput = z.infer<typeof GuardarInfoNegocioSchema>;
