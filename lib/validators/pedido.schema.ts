import { z } from "zod";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5MB

export const NuevoPedidoSchema = z.object({
  cliente_id: z.string().uuid("Selecciona un cliente."),
  cotizacion_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("")),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0."),
  fecha_compra: z.string().min(1, "Selecciona la fecha de compra."),
  foto: z
    .instanceof(File, { message: "Sube una foto del pedido." })
    .refine((f) => f.size > 0, "Sube una foto del pedido.")
    .refine((f) => f.size <= TAMANO_MAXIMO, "La foto no puede pesar más de 5MB.")
    .refine(
      (f) => TIPOS_PERMITIDOS.includes(f.type),
      "Solo se aceptan fotos JPG, PNG o WebP."
    ),
});

export type NuevoPedidoInput = z.infer<typeof NuevoPedidoSchema>;
