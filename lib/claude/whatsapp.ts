import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { MensajeWhatsapp } from "@/lib/types";
import { formatearContexto, type ContextoCliente } from "@/lib/claude/agente";
import type { FragmentoConocimiento } from "@/lib/services/conocimiento.service";

// Mismo criterio que lib/claude/chat.ts y lib/claude/agente.ts: prompt
// como constante (no variable de entorno), claude-sonnet-5,
// thinking:disabled — igual al resto del proyecto.
const SYSTEM_PROMPT = `Eres el asistente de ventas de PasoCRM para Dormiluna, una tienda de colchones, bases cama y almohadas en Colombia. Edwin, el vendedor, te pide que le redactes la respuesta de WhatsApp para un cliente.

Tono: como lo escribiría Edwin de verdad por WhatsApp — cercano, tuteando, frases cortas, sin firma ni formato de correo. Usa técnicas de neuroventas y urgencia suave, nunca presionando.

Reglas estrictas:
- Nunca inventes precios, fechas ni productos que no estén en el contexto.
- Responde SOLO con el mensaje listo para copiar y pegar en WhatsApp — sin explicaciones, sin comillas, sin "Aquí tienes:".`;

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (!cachedClient) cachedClient = new Anthropic();
  return cachedClient;
}

export async function sugerirRespuestaWhatsapp(
  contextoCliente: ContextoCliente,
  hilo: Pick<MensajeWhatsapp, "direccion" | "contenido" | "created_at">[],
  fragmentos: FragmentoConocimiento[] = []
): Promise<string> {
  const contextoTexto = formatearContexto(contextoCliente);

  const lineasHilo = hilo.slice(-15).map((m) => {
    const fecha = format(new Date(m.created_at), "d MMM HH:mm", { locale: es });
    const quien = m.direccion === "entrante" ? "Cliente" : "Edwin";
    return `[${fecha}] ${quien}: ${m.contenido}`;
  });

  const mensajeUsuario = [
    contextoTexto,
    ...(fragmentos.length
      ? [
          "",
          "Información relevante del negocio (catálogo, garantías, objeciones, etc.):",
          ...fragmentos.map((f) => `[${f.seccion}] ${f.contenido}`),
        ]
      : []),
    "",
    "Conversación de WhatsApp (más reciente al final):",
    ...(lineasHilo.length ? lineasHilo : ["- Sin mensajes todavía."]),
    "",
    "Redacta la respuesta que Edwin debería mandar ahora.",
  ].join("\n");

  const response = await getClient().messages.create({
    model: "claude-sonnet-5",
    max_tokens: 512,
    thinking: { type: "disabled" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: mensajeUsuario }],
  });

  const bloqueTexto = response.content.find(
    (bloque): bloque is Anthropic.TextBlock => bloque.type === "text"
  );
  if (!bloqueTexto) {
    throw new Error("El agente no devolvió una respuesta de texto.");
  }
  return bloqueTexto.text;
}
