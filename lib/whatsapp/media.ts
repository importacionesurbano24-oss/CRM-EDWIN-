import "server-only";

const GRAPH_API_VERSION = "v25.0";

export interface AudioDescargado {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Descarga una nota de voz de WhatsApp a partir de su media id. Hacen falta
 * dos llamadas a la Graph API: la primera resuelve una URL temporal (~5 min
 * de vida), la segunda descarga el binario — ambas con el mismo token.
 */
export async function descargarAudioWhatsapp(mediaId: string): Promise<AudioDescargado | null> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    console.error("descargarAudioWhatsapp: falta WHATSAPP_ACCESS_TOKEN.");
    return null;
  }

  try {
    const resMeta = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resMeta.ok) {
      console.error("descargarAudioWhatsapp (metadata):", resMeta.status, await resMeta.text());
      return null;
    }

    const meta = (await resMeta.json()) as { url?: string; mime_type?: string };
    if (!meta.url) return null;

    const resArchivo = await fetch(meta.url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resArchivo.ok) {
      console.error("descargarAudioWhatsapp (archivo):", resArchivo.status);
      return null;
    }

    const buffer = Buffer.from(await resArchivo.arrayBuffer());
    return { buffer, mimeType: meta.mime_type ?? "audio/ogg" };
  } catch (error) {
    console.error("descargarAudioWhatsapp:", error);
    return null;
  }
}
