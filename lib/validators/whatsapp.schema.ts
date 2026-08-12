import { z } from "zod";

export const EnviarWhatsappSchema = z.object({
  contenido: z
    .string()
    .trim()
    .min(1, "Escribe un mensaje.")
    .max(4096, "El mensaje es demasiado largo para WhatsApp."),
});

export type EnviarWhatsappInput = z.infer<typeof EnviarWhatsappSchema>;
