import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { AlertaBriefing } from "@/lib/services/briefing.service";

// Prompt del sistema como constante (no como variable de entorno), según CLAUDE.md.
const SYSTEM_PROMPT = `Eres el asistente que arma el resumen matutino ("Daily Briefing") de PasoCRM para Dormiluna, una tienda de colchones en Colombia. Cada mañana Edwin (el vendedor) revisa esta lista antes de empezar a llamar clientes.

Te paso una lista de clientes que YA fueron marcados por reglas de negocio fijas (no las inventas tú, ya vienen decididas):
- whatsapp_sin_responder: te escribió por WhatsApp y todavía no le has respondido.
- compro_posventa: compró hace más de 30 días sin pasar a Posventa.
- posventa_referido: lleva más de 15 días en Posventa sin pedirle referido.
- cotizo_frio: lleva más de 5 días en Cotizó sin respuesta — riesgo de perderlo.
- cotizo_seguimiento: lleva más de 2 días en Cotizó sin respuesta.
- sin_accion: lleva más de 10 días sin ningún movimiento, en cualquier etapa.

Para cada cliente de la lista, escribe:
- situacion: una frase corta (máximo 15 palabras) describiendo qué está pasando, con su nombre y los días.
- accion_sugerida: una frase corta y accionable de qué debería hacer Edwin.

No cambies la regla ni sugieras una etapa distinta a la que ya viene calculada — solo redacta el texto, cálido y directo, como lo diría un vendedor colombiano de confianza. No inventes datos (productos, precios) que no estén en la lista.`;

const BriefingItemSchema = z.object({
  clienteId: z.string(),
  situacion: z.string().describe("Frase corta describiendo la situación detectada."),
  accion_sugerida: z.string().describe("Frase corta y accionable."),
});

const BriefingSchema = z.object({
  sugerencias: z.array(BriefingItemSchema),
});

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (!cachedClient) cachedClient = new Anthropic();
  return cachedClient;
}

/**
 * Una sola llamada a Claude para TODAS las alertas del día (no una por
 * cliente) — mantiene el costo y la latencia bajos incluso con muchos
 * clientes activos. Si la llamada falla (sin API key, error de red, etc.)
 * el caller debe usar textoPlantilla() como respaldo; esta función no
 * atrapa errores, los deja subir.
 */
export async function redactarBriefing(
  alertas: AlertaBriefing[]
): Promise<Map<string, { situacion: string; accionSugerida: string }>> {
  if (alertas.length === 0) return new Map();

  const listaParaClaude = alertas.map((a) => ({
    clienteId: a.clienteId,
    nombre: a.clienteNombre,
    etapaActual: a.etapaActual,
    dias: a.dias,
    regla: a.regla,
  }));

  const response = await getClient().messages.parse({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    thinking: { type: "disabled" },
    output_config: {
      effort: "low",
      format: zodOutputFormat(BriefingSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Lista de clientes a redactar (JSON):\n${JSON.stringify(listaParaClaude, null, 2)}`,
      },
    ],
  });

  if (!response.parsed_output) {
    throw new Error("El agente no devolvió un briefing válido.");
  }

  const mapa = new Map<string, { situacion: string; accionSugerida: string }>();
  for (const item of response.parsed_output.sugerencias) {
    mapa.set(item.clienteId, {
      situacion: item.situacion,
      accionSugerida: item.accion_sugerida,
    });
  }
  return mapa;
}
