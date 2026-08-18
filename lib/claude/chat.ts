import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { FragmentoConocimiento } from "@/lib/services/conocimiento.service";
import { METODOLOGIA_VENTAS } from "@/lib/claude/metodologiaVentas";
import { MODELOS_IA, NIVEL_IA_POR_DEFECTO, type NivelIA } from "@/lib/claude/modelos";

// Prompt base compartido por los dos chats (cliente y negocio). Cada
// llamada le agrega su propio bloque de contexto (ver
// lib/services/chatContexto.service.ts) más el contenido de info_negocio.
const SYSTEM_PROMPT_BASE = `Eres el asistente de ventas de PasoCRM para Dormiluna, una tienda de colchones, bases cama y almohadas en Colombia. Hablas con Edwin, el vendedor y dueño del negocio, por chat.

Tono: cercano, tuteando, sin tecnicismos ni lenguaje corporativo — como hablaría un vendedor de confianza.

Cuando te pida un mensaje o una estrategia para un cliente específico, aplica esto:
${METODOLOGIA_VENTAS}

Reglas estrictas:
- Nunca inventes precios, fechas, productos ni datos que no estén explícitamente en el contexto que te paso.
- Si te preguntan algo de catálogo, garantías u objeciones y no está en la información del negocio que te paso, dilo honestamente en vez de inventar.
- Responde en español, de forma directa y breve — esto es un chat, no un informe.

REGLAS DE OUTPUT:
- Cuando generes un mensaje para enviar a un cliente, entrega ÚNICAMENTE el mensaje. Sin explicaciones, sin análisis, sin comentarios al final.
- Si necesitas aclarar algo, hazlo ANTES del mensaje, nunca después.
- Formato: el mensaje listo para copiar y pegar. Nada más.

Además de tu "respuesta" (lo que ve Edwin en el chat), completa "mensaje_para_cliente": si tu respuesta ES o INCLUYE un mensaje listo para copiar y enviarle al cliente por WhatsApp, poné ahí SOLO ese mensaje tal cual debe enviarse (sin nada de tu comentario alrededor). Si tu respuesta es una pregunta a Edwin, un análisis, una estrategia, un saludo, o cualquier cosa que no sea un mensaje literal para el cliente, poné null.`;

const RespuestaChatSchema = z.object({
  respuesta: z.string().describe("La respuesta completa que ve Edwin en el chat."),
  mensaje_para_cliente: z
    .string()
    .nullable()
    .describe(
      "SOLO el texto del mensaje listo para enviarle al cliente por WhatsApp, si la respuesta incluye uno. null si no aplica (preguntas, análisis, saludos, etc.)."
    ),
});

export interface MensajeConversacion {
  rol: "user" | "assistant";
  mensaje: string;
}

export interface RespuestaChat {
  texto: string;
  /** Mensaje listo para enviar al cliente por WhatsApp, o null si esta respuesta no es un mensaje para el cliente. */
  mensajeParaCliente: string | null;
}

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (!cachedClient) cachedClient = new Anthropic();
  return cachedClient;
}

/**
 * Responde un turno de chat. `contextoEspecifico` es el bloque de cliente o
 * de negocio ya armado (lib/services/chatContexto.service.ts); `fragmentos`
 * son las secciones de conocimiento más relevantes al mensaje del usuario
 * (búsqueda semántica vía lib/services/conocimiento.service.ts), o [] si no
 * hay ninguna relevante o falta VOYAGE_API_KEY.
 */
export async function responderChat(
  historial: MensajeConversacion[],
  contextoEspecifico: string,
  fragmentos: FragmentoConocimiento[],
  nivel: NivelIA = NIVEL_IA_POR_DEFECTO
): Promise<RespuestaChat> {
  const system = [
    SYSTEM_PROMPT_BASE,
    "",
    contextoEspecifico,
    ...(fragmentos.length
      ? [
          "",
          "Información relevante del negocio (catálogo, garantías, objeciones, etc.):",
          ...fragmentos.map((f) => `[${f.seccion}] ${f.contenido}`),
        ]
      : []),
  ].join("\n");

  const response = await getClient().messages.parse({
    model: MODELOS_IA[nivel],
    max_tokens: 1024,
    thinking: { type: "disabled" },
    output_config: { format: zodOutputFormat(RespuestaChatSchema) },
    system,
    messages: historial.map((m) => ({ role: m.rol, content: m.mensaje })),
  });

  if (!response.parsed_output) {
    throw new Error("El agente no devolvió una respuesta válida.");
  }

  return {
    texto: response.parsed_output.respuesta,
    mensajeParaCliente: response.parsed_output.mensaje_para_cliente,
  };
}
