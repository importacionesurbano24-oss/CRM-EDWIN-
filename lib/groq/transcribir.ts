import "server-only";

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const MODEL = "whisper-large-v3";

const EXTENSION_POR_MIME: Record<string, string> = {
  "audio/ogg": "ogg",
  "audio/opus": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/webm": "webm",
};

function extensionDeMime(mimeType: string): string {
  const base = mimeType.split(";")[0].trim();
  return EXTENSION_POR_MIME[base] ?? "ogg";
}

/**
 * Transcribe un audio con la API de Groq (Whisper). Devuelve null si falta
 * GROQ_API_KEY o si la llamada falla — mismo criterio que generarEmbedding
 * con Voyage: el webhook sigue funcionando (con un mensaje de reemplazo) en
 * vez de romperse por falta de esta integración opcional.
 */
export async function transcribirAudio(
  buffer: Buffer,
  mimeType: string
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("transcribirAudio: falta GROQ_API_KEY.");
    return null;
  }

  try {
    const form = new FormData();
    form.append("model", MODEL);
    form.append("language", "es");
    form.append(
      "file",
      new Blob([new Uint8Array(buffer)], { type: mimeType }),
      `audio.${extensionDeMime(mimeType)}`
    );

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      console.error("transcribirAudio:", res.status, await res.text());
      return null;
    }

    const json = (await res.json()) as { text?: string };
    return json.text?.trim() || null;
  } catch (error) {
    console.error("transcribirAudio:", error);
    return null;
  }
}
