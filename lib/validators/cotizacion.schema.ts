import { z } from "zod";

export const ProductoItemSchema = z.object({
  nombre: z.string().trim().min(1, "Ponle nombre al producto."),
  cantidad: z.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
  precio_unitario: z.coerce
    .number()
    .nonnegative("El precio no puede ser negativo."),
});

export const NuevaCotizacionSchema = z.object({
  cliente_id: z.string().uuid("Selecciona un cliente."),
  productos: z
    .array(ProductoItemSchema)
    .min(1, "Agrega al menos un producto."),
});

export type NuevaCotizacionInput = z.infer<typeof NuevaCotizacionSchema>;
