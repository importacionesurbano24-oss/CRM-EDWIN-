import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type {
  ClienteConEtapa,
  Seguimiento,
  Cotizacion,
  Pedido,
  MensajeWhatsapp,
} from "@/lib/types";
import { ETAPA_META } from "@/lib/ui/etapa";
import { formatMoneda } from "@/lib/ui/cotizacion";
import { METODOLOGIA_VENTAS } from "@/lib/claude/metodologiaVentas";
import { MODELOS_IA, NIVEL_IA_POR_DEFECTO, type NivelIA } from "@/lib/claude/modelos";

// Prompt del sistema como constante (no como variable de entorno), según CLAUDE.md.
const SYSTEM_PROMPT = `Eres el asistente de ventas de PasoCRM para Dormiluna, una tienda de colchones en Colombia. Ayudas a Edwin, el vendedor, a decidir qué hacer a continuación con un cliente o prospecto, a partir de su historial de seguimiento, cotizaciones y pedidos.

Da una recomendación concreta y accionable para la próxima acción — nunca genérica como "hacer seguimiento". Y redacta un borrador de mensaje corto en español, tono cercano y profesional (como lo escribiría Edwin por WhatsApp, no una plantilla corporativa), listo para copiar y enviar tal cual.

${METODOLOGIA_VENTAS}

No inventes datos que no estén en el contexto (precios, fechas, productos específicos). Si falta un dato puntual, sé genérico solo en ese punto, pero mantén el resto de la recomendación concreta.`;

const SugerenciaSchema = z.object({
  proxima_accion: z
    .string()
    .describe(
      "Una frase corta y accionable: qué debería hacer Edwin ahora con este cliente."
    ),
  mensaje_sugerido: z
    .string()
    .describe(
      "Mensaje breve en español, listo para copiar y enviar por WhatsApp al cliente."
    ),
});

export type Sugerencia = z.infer<typeof SugerenciaSchema>;

export interface ContextoCliente {
  cliente: Pick<
    ClienteConEtapa,
    "nombre" | "etapa" | "origen" | "proxima_accion" | "proxima_accion_fecha"
  >;
  historial: Pick<Seguimiento, "etapa" | "notas" | "proxima_accion" | "created_at">[];
  cotizaciones: Pick<Cotizacion, "monto_total" | "estado" | "created_at">[];
  pedidos: Pick<Pedido, "monto" | "fecha_compra">[];
  /** Contenido ya extraído de la cotización externa más reciente (si el cliente tiene una anexada). */
  cotizacionExterna?: { url: string; contenido: string } | null;
  /** Últimos mensajes de WhatsApp con este cliente, si los hay. */
  mensajesWhatsapp?: Pick<MensajeWhatsapp, "direccion" | "contenido" | "created_at">[];
}

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (!cachedClient) cachedClient = new Anthropic();
  return cachedClient;
}

export async function sugerirProximaAccion(
  contexto: ContextoCliente,
  nivel: NivelIA = NIVEL_IA_POR_DEFECTO
): Promise<Sugerencia> {
  const response = await getClient().messages.parse({
    model: MODELOS_IA[nivel],
    max_tokens: 1024,
    thinking: { type: "disabled" },
    output_config: {
      // El parámetro "effort" no existe en Haiku 4.5 — solo se manda con el modelo avanzado (Sonnet).
      ...(nivel === "avanzado" && { effort: "low" as const }),
      format: zodOutputFormat(SugerenciaSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: formatearContexto(contexto) }],
  });

  if (!response.parsed_output) {
    throw new Error("El agente no devolvió una sugerencia válida.");
  }
  return response.parsed_output;
}

export function formatearContexto(ctx: ContextoCliente): string {
  const { cliente, historial, cotizaciones, pedidos, cotizacionExterna, mensajesWhatsapp } = ctx;
  const lineas: string[] = [];

  lineas.push(`Cliente: ${cliente.nombre}`);
  lineas.push(
    `Etapa actual: ${cliente.etapa ? ETAPA_META[cliente.etapa].label : "Sin etapa"}`
  );
  lineas.push(`Origen: ${cliente.origen}`);
  if (cliente.proxima_accion) {
    lineas.push(
      `Próxima acción ya registrada: ${cliente.proxima_accion}` +
        (cliente.proxima_accion_fecha
          ? ` (${cliente.proxima_accion_fecha})`
          : "")
    );
  }

  lineas.push("");
  lineas.push("Historial de seguimientos (más reciente primero):");
  if (historial.length === 0) {
    lineas.push("- Sin seguimientos registrados todavía.");
  }
  for (const h of historial.slice(0, 10)) {
    const fecha = format(new Date(h.created_at), "d MMM yyyy", { locale: es });
    lineas.push(
      `- [${fecha}] Etapa: ${ETAPA_META[h.etapa].label}${
        h.notas ? ` — Notas: ${h.notas}` : ""
      }`
    );
  }

  lineas.push("");
  lineas.push("Cotizaciones:");
  if (cotizaciones.length === 0) {
    lineas.push("- Ninguna.");
  }
  for (const c of cotizaciones) {
    const fecha = format(new Date(c.created_at), "d MMM yyyy", { locale: es });
    lineas.push(
      `- [${fecha}] ${formatMoneda(c.monto_total)} — estado: ${c.estado}`
    );
  }

  lineas.push("");
  lineas.push("Pedidos (compras confirmadas):");
  if (pedidos.length === 0) {
    lineas.push("- Ninguno.");
  }
  for (const p of pedidos) {
    lineas.push(`- [${p.fecha_compra}] ${formatMoneda(p.monto)}`);
  }

  if (mensajesWhatsapp && mensajesWhatsapp.length > 0) {
    lineas.push("");
    lineas.push("Conversación de WhatsApp reciente (más reciente al final):");
    for (const m of mensajesWhatsapp.slice(-15)) {
      const fecha = format(new Date(m.created_at), "d MMM HH:mm", { locale: es });
      const quien = m.direccion === "entrante" ? "Cliente" : "Edwin";
      lineas.push(`- [${fecha}] ${quien}: ${m.contenido}`);
    }
  }

  if (cotizacionExterna) {
    lineas.push("");
    lineas.push(`Contenido de la cotización externa (${cotizacionExterna.url}):`);
    lineas.push(cotizacionExterna.contenido);
  }

  lineas.push("");
  lineas.push(
    "Con este contexto, ¿qué debería hacer Edwin ahora con este cliente?"
  );

  return lineas.join("\n");
}
