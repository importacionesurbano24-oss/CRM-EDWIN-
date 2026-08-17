import { z } from "zod";

const TAMANO_MAXIMO = 4 * 1024 * 1024; // 4MB — techo real de Vercel para el body de un Server Action es 4.5MB
const TIPOS_ACEPTADOS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

export const AnalizarCargaMasivaSchema = z.object({
  archivo: z
    .instanceof(File, { message: "Selecciona un archivo." })
    .refine((f) => f.size > 0, "El archivo está vacío.")
    .refine((f) => f.size <= TAMANO_MAXIMO, "El archivo no puede pesar más de 4MB.")
    .refine(
      (f) => TIPOS_ACEPTADOS.includes(f.type) || /\.(xlsx|txt|csv)$/i.test(f.name),
      "Formato no soportado. Usa PDF, Excel (.xlsx), imagen (JPG/PNG/WEBP) o texto (.txt/.csv)."
    ),
  instruccion: z.string().trim().min(3, "Escribe qué quieres hacer con este archivo."),
  nivel: z.enum(["basico", "avanzado"]).optional(),
});

export type AnalizarCargaMasivaInput = z.infer<typeof AnalizarCargaMasivaSchema>;
