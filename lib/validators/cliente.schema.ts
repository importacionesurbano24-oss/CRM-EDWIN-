import { z } from "zod";

export const ETAPAS = [
  "prospecto",
  "cotizo",
  "compro",
  "posventa",
  "referido_solicitado",
] as const;

export const ORIGENES = ["walk-in", "referido", "otro"] as const;

export const NuevoClienteSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres."),
  telefono_whatsapp: z
    .string()
    .trim()
    .min(7, "Ingresa un número de WhatsApp válido."),
  email: z
    .string()
    .trim()
    .email("Correo inválido.")
    .optional()
    .or(z.literal("")),
  origen: z.enum(ORIGENES),
  etapa: z.enum(ETAPAS),
  proxima_accion: z.string().trim().optional().or(z.literal("")),
  proxima_accion_fecha: z.string().trim().optional().or(z.literal("")),
});

export type NuevoClienteInput = z.infer<typeof NuevoClienteSchema>;

export const NuevoSeguimientoSchema = z.object({
  cliente_id: z.string().uuid(),
  etapa: z.enum(ETAPAS),
  proxima_accion: z.string().trim().optional().or(z.literal("")),
  proxima_accion_fecha: z.string().trim().optional().or(z.literal("")),
  notas: z.string().trim().optional().or(z.literal("")),
  link_cotizacion: z
    .string()
    .trim()
    .url("Ingresa un link válido (debe empezar con https://).")
    .optional()
    .or(z.literal("")),
});

export type NuevoSeguimientoInput = z.infer<typeof NuevoSeguimientoSchema>;
