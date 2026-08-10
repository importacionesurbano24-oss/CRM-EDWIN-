import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

export type ContenidoArchivo =
  | { tipo: "pdf"; base64: string }
  | { tipo: "imagen"; mediaType: "image/jpeg" | "image/png" | "image/webp"; base64: string }
  | { tipo: "texto"; texto: string };

const SYSTEM_PROMPT = `Eres el asistente que ayuda a Edwin a actualizar el catálogo de productos de Dormiluna (colchones, bases cama, almohadas) a partir de un archivo que sube (PDF, Excel convertido a texto, foto de una lista de precios, o texto plano).

Se te da el catálogo actual (texto libre) y el contenido del archivo nuevo, más una instrucción de Edwin sobre qué hacer.

Tu trabajo:
1. Extraer del archivo los productos con su nombre, precio y descripción/característica principal.
2. Aplicar la instrucción de Edwin contra el catálogo actual: si dice "agrega productos nuevos", conserva todo lo que ya había y suma lo nuevo; si dice "actualiza precios", reemplaza el precio de los productos que coincidan por nombre y deja el resto igual; si la instrucción no es clara sobre qué hacer con lo que no está en el archivo, conserva el catálogo actual y solo agrega/actualiza lo que el archivo sí menciona.
3. Devolver el catálogo COMPLETO y final como texto plano, en el mismo estilo de lista simple que ya se usa (nombre — precio — descripción corta, uno por línea o párrafo), nunca como JSON ni tabla markdown.
4. Nunca inventes precios, productos o descripciones que no estén en el archivo o en el catálogo actual.
5. Redacta un resumen corto y concreto de los cambios, en español, como lo diría un vendedor — ejemplo: "Encontré 12 productos: 3 son nuevos (Colchón X, Base Y, Almohada Z), 9 actualizan el precio."`;

const AnalisisCatalogoSchema = z.object({
  catalogo_actualizado: z.string().describe("Catálogo completo final, texto plano, listo para guardar."),
  resumen_cambios: z.string().describe('Frase corta para mostrarle a Edwin, ej: "Encontré 12 productos: 3 nuevos, 9 actualizan precio."'),
  productos_nuevos: z.number().int().min(0),
  productos_actualizados: z.number().int().min(0),
});

export type AnalisisCatalogo = z.infer<typeof AnalisisCatalogoSchema>;

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (!cachedClient) cachedClient = new Anthropic();
  return cachedClient;
}

export async function analizarCargaMasiva(params: {
  catalogoActual: string;
  instruccion: string;
  archivo: ContenidoArchivo;
}): Promise<AnalisisCatalogo> {
  const { catalogoActual, instruccion, archivo } = params;

  const bloqueArchivo: Anthropic.ContentBlockParam =
    archivo.tipo === "pdf"
      ? {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: archivo.base64 },
        }
      : archivo.tipo === "imagen"
        ? {
            type: "image",
            source: { type: "base64", media_type: archivo.mediaType, data: archivo.base64 },
          }
        : { type: "text", text: archivo.texto };

  const mensajeUsuario = [
    `Catálogo actual:\n${catalogoActual || "(vacío, todavía no hay nada guardado)"}`,
    "",
    `Instrucción de Edwin: ${instruccion}`,
    "",
    "Archivo adjunto:",
  ].join("\n");

  const response = await getClient().messages.parse({
    model: "claude-sonnet-5",
    max_tokens: 8192,
    thinking: { type: "disabled" },
    output_config: {
      effort: "medium",
      format: zodOutputFormat(AnalisisCatalogoSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: mensajeUsuario }, bloqueArchivo],
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("El agente no devolvió un análisis válido.");
  }
  return response.parsed_output;
}
