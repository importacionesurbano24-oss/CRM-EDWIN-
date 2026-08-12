import "server-only";
import { formatoE164 } from "@/lib/whatsapp/telefono";

const GRAPH_API_VERSION = "v25.0";

export type ResultadoEnvioWhatsapp =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

/** Manda un mensaje de texto libre por la Cloud API de WhatsApp de Meta. */
export async function enviarMensajeWhatsapp(
  telefono: string,
  texto: string
): Promise<ResultadoEnvioWhatsapp> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    return { ok: false, error: "Faltan las credenciales de WhatsApp por configurar." };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formatoE164(telefono),
          type: "text",
          text: { body: texto },
        }),
      }
    );

    const json = (await res.json()) as {
      messages?: { id: string }[];
      error?: { message?: string };
    };

    if (!res.ok) {
      console.error("enviarMensajeWhatsapp:", json);
      return { ok: false, error: json.error?.message ?? "WhatsApp rechazó el mensaje." };
    }

    return { ok: true, messageId: json.messages?.[0]?.id ?? "" };
  } catch (error) {
    console.error("enviarMensajeWhatsapp:", error);
    return { ok: false, error: "No se pudo conectar con WhatsApp." };
  }
}
