"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getClienteConEtapa,
  getHistorialCliente,
  getClientesConEtapa,
} from "@/lib/data/clientes";
import { getCotizaciones } from "@/lib/data/cotizaciones";
import { getPedidos } from "@/lib/data/pedidos";
import { getMensajesWhatsapp } from "@/lib/data/whatsapp";
import { getPedidosReporte } from "@/lib/data/reportes";
import { responderChat, type MensajeConversacion } from "@/lib/claude/chat";
import {
  buscarConocimientoRelevante,
  type FragmentoConocimiento,
} from "@/lib/services/conocimiento.service";
import {
  construirContextoCliente,
  construirContextoNegocio,
} from "@/lib/services/chatContexto.service";
import { explicarNivelIA, type NivelIA } from "@/lib/claude/modelos";
import { leerContenidoUrl } from "@/lib/utils/leer-url";
import { transcribirAudio } from "@/lib/groq/transcribir";
import {
  EnviarMensajeEntrenamientoSchema,
  GuardarPromptActivoSchema,
  LeerUrlEntrenamientoSchema,
  type EnviarMensajeEntrenamientoInput,
  type GuardarPromptActivoInput,
} from "@/lib/validators/entrenamiento.schema";
import type { ActionResult } from "@/lib/action-result";
import type { AgentConfig } from "@/lib/types";

export interface TurnoEntrenamiento {
  texto: string;
  mensajeParaCliente: string | null;
  modeloUsado: string;
  nivelResuelto: NivelIA;
  razon: string;
  tokensEntrada: number;
  tokensSalida: number;
  ragChunks: FragmentoConocimiento[];
  timestamp: string;
}

/**
 * Igual que actionEnviarMensajeChat (chat.actions.ts) pero para el sandbox
 * de /entrenamiento: no inserta nada en chat_agente, no revalida ninguna
 * ruta, y admite override de system prompt / modelo forzado / RAG on-off.
 */
export async function actionEnviarMensajeEntrenamiento(
  input: EnviarMensajeEntrenamientoInput,
  historialPrevio: MensajeConversacion[]
): Promise<ActionResult<TurnoEntrenamiento>> {
  const parsed = EnviarMensajeEntrenamientoSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }
  const {
    clienteId,
    mensaje,
    systemPrompt,
    modoModelo,
    useRag,
    urlReferencia,
    contenidoUrlReferencia,
  } = parsed.data;

  const supabase = await createClient();

  const fragmentos = useRag
    ? await buscarConocimientoRelevante(supabase, mensaje)
    : [];

  let contextoEspecifico: string;
  if (clienteId) {
    const [cliente, historialCliente, cotizaciones, pedidos, mensajesWhatsapp] =
      await Promise.all([
        getClienteConEtapa(supabase, clienteId),
        getHistorialCliente(supabase, clienteId),
        getCotizaciones(supabase),
        getPedidos(supabase),
        getMensajesWhatsapp(supabase, clienteId),
      ]);

    if (!cliente) {
      return { data: null, error: "Cliente no encontrado." };
    }

    contextoEspecifico = construirContextoCliente({
      cliente,
      historial: historialCliente,
      cotizaciones: cotizaciones.filter((c) => c.cliente_id === clienteId),
      pedidos: pedidos.filter((p) => p.cliente_id === clienteId),
      mensajesWhatsapp,
    });
  } else {
    const [clientes, pedidosReporte] = await Promise.all([
      getClientesConEtapa(supabase),
      getPedidosReporte(supabase),
    ]);
    contextoEspecifico = construirContextoNegocio(clientes, pedidosReporte);
  }

  // Mismo patrón que la cotización externa en agente.ts: el texto ya
  // viene leído (actionLeerUrlEntrenamiento), acá solo se agrega al
  // contexto — no se relee la URL en cada mensaje de la conversación.
  if (urlReferencia && contenidoUrlReferencia) {
    contextoEspecifico += `\n\nContenido de referencia (${urlReferencia}):\n${contenidoUrlReferencia}`;
  }

  const historialCompleto: MensajeConversacion[] = [
    ...historialPrevio,
    { rol: "user", mensaje },
  ];

  const nivelForzado = modoModelo === "auto" ? undefined : modoModelo;
  const razon =
    modoModelo === "auto"
      ? explicarNivelIA(mensaje).razon
      : `Forzado manualmente a ${modoModelo === "basico" ? "Haiku" : "Sonnet"}.`;

  try {
    const respuesta = await responderChat(
      historialCompleto,
      contextoEspecifico,
      fragmentos,
      nivelForzado,
      { systemPromptOverride: systemPrompt }
    );

    return {
      data: {
        texto: respuesta.texto,
        mensajeParaCliente: respuesta.mensajeParaCliente,
        modeloUsado: respuesta.modeloUsado,
        nivelResuelto: respuesta.nivelResuelto,
        razon,
        tokensEntrada: respuesta.tokensEntrada,
        tokensSalida: respuesta.tokensSalida,
        ragChunks: fragmentos,
        timestamp: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    console.error("actionEnviarMensajeEntrenamiento:", error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "No se pudo generar la respuesta.",
    };
  }
}

/** Desactiva la fila activa anterior (si hay) e inserta una nueva activa. */
export async function actionGuardarPromptActivo(
  input: GuardarPromptActivoInput
): Promise<ActionResult<AgentConfig>> {
  const parsed = GuardarPromptActivoSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  const { error: errorDesactivar } = await supabase
    .from("agent_config")
    .update({ is_active: false })
    .eq("is_active", true);

  if (errorDesactivar) {
    return { data: null, error: errorDesactivar.message };
  }

  const { data, error } = await supabase
    .from("agent_config")
    .insert({
      name: parsed.data.name,
      system_prompt: parsed.data.systemPrompt,
      nivel_ia: parsed.data.nivelIa,
      use_rag: parsed.data.useRag,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    return { data: null, error: error?.message ?? "No se pudo guardar el prompt." };
  }

  return { data, error: null };
}

export async function actionCargarPromptActivo(): Promise<
  ActionResult<AgentConfig | null>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agent_config")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Lee una URL de referencia (ej. la ficha de un producto, una página de
 * la competencia) para que el sandbox de /agente se la pueda pasar al
 * agente como contexto. Reutiliza leerContenidoUrl (lib/utils/leer-url),
 * la misma función que ya usa agente.ts para cotizaciones externas — no
 * duplica la lógica de descarga/extracción de texto.
 */
export async function actionLeerUrlEntrenamiento(
  url: string
): Promise<ActionResult<{ url: string; contenido: string }>> {
  const parsed = LeerUrlEntrenamientoSchema.safeParse({ url });
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0].message };
  }

  const contenido = await leerContenidoUrl(parsed.data.url);

  return { data: { url: parsed.data.url, contenido }, error: null };
}

/**
 * Transcribe una nota de voz grabada en el sandbox de /agente, para
 * probar el prompt igual que si un cliente mandara audio por WhatsApp.
 * Reutiliza transcribirAudio (lib/groq/transcribir), la misma función
 * que ya usa el webhook real de WhatsApp — no duplica la llamada a Groq.
 */
export async function actionTranscribirAudioEntrenamiento(
  formData: FormData
): Promise<ActionResult<{ texto: string }>> {
  const archivo = formData.get("audio");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { data: null, error: "No se recibió ningún audio." };
  }

  const buffer = Buffer.from(await archivo.arrayBuffer());
  const texto = await transcribirAudio(buffer, archivo.type || "audio/webm");

  if (!texto) {
    return {
      data: null,
      error:
        "No se pudo transcribir el audio — revisá que GROQ_API_KEY esté configurada.",
    };
  }

  return { data: { texto }, error: null };
}
