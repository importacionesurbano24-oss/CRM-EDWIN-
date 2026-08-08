import "server-only";

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-3-lite";

/**
 * Genera un embedding con Voyage AI — la API de Claude no tiene endpoint
 * de embeddings; Voyage es el proveedor que recomienda Anthropic. Sin
 * dependencias nuevas: es un POST con fetch. Devuelve null si falta
 * VOYAGE_API_KEY o la llamada falla, para que guardar texto / responder el
 * chat sigan funcionando sin RAG (mismo criterio que si falta
 * ANTHROPIC_API_KEY en el resto del proyecto).
 */
export async function generarEmbedding(
  texto: string,
  tipo: "document" | "query"
): Promise<number[] | null> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey || !texto.trim()) return null;

  try {
    const res = await fetch(VOYAGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: [texto], model: MODEL, input_type: tipo }),
    });

    if (!res.ok) {
      console.error("generarEmbedding:", res.status, await res.text());
      return null;
    }

    const json = (await res.json()) as { data: { embedding: number[] }[] };
    return json.data[0]?.embedding ?? null;
  } catch (error) {
    console.error("generarEmbedding:", error);
    return null;
  }
}
