import "server-only";

const TIMEOUT_MS = 8000;
const MAX_CARACTERES = 6000;

/**
 * Descarga una URL y extrae su texto plano para dárselo de contexto al
 * agente. Solo sirve para páginas de texto/HTML públicas (no PDFs, no
 * páginas que requieran login) — si no se puede leer, devuelve un mensaje
 * explicando por qué en vez de lanzar, para que la sugerencia del agente
 * no se caiga por un link roto.
 */
export async function leerContenidoUrl(url: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "[Link inválido]";
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return "[Link inválido]";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(parsed, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PasoCRM/1.0)" },
    });

    if (!res.ok) {
      return `[No se pudo abrir el link (HTTP ${res.status})]`;
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return `[El link no es una página de texto legible (tipo: ${contentType || "desconocido"}); Edwin debe revisarlo manualmente]`;
    }

    const html = await res.text();
    const texto = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return texto.slice(0, MAX_CARACTERES) || "[La página no tiene texto legible]";
  } catch {
    return "[No se pudo leer el contenido de la URL]";
  } finally {
    clearTimeout(timeout);
  }
}
