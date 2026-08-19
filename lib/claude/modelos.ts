/**
 * Los dos niveles de modelo que puede usar cualquier función de IA del
 * sistema. "basico" (Haiku) es más rápido y económico, para respuestas
 * simples. "avanzado" (Sonnet — el único que se usaba antes de esto) piensa
 * mejor con contexto largo o casos delicados, y es el valor por defecto en
 * todos lados para no cambiar el comportamiento existente.
 *
 * Sin "server-only": el selector en el cliente también necesita el tipo y
 * el valor por defecto, aunque el modelo en sí solo se llama en el servidor.
 */
export const MODELOS_IA = {
  basico: "claude-haiku-4-5",
  avanzado: "claude-sonnet-5",
} as const;

export type NivelIA = keyof typeof MODELOS_IA;

export const NIVEL_IA_POR_DEFECTO: NivelIA = "basico";

/**
 * Heurística de fallback — solo para interacción directa con clientes
 * (agente.ts, chat.ts, whatsapp.ts). Devuelve "avanzado" si el texto
 * muestra señales de objeción o negociación: dudas de precio/descuento,
 * comparación con otra marca o "está muy caro", desconfianza o quejas,
 * negociación de forma de pago/financiación, o un mensaje largo con
 * varias preguntas encadenadas. Para todo lo demás devuelve "basico".
 */
export function decidirNivelIA(mensaje: string): NivelIA {
  const texto = mensaje.toLowerCase();

  const señalesDeObjecion = [
    /\b(descuento|rebaja|muy car[oa]|carísim[oa])\b/,
    /\b(otra marca|otra tienda|más barato|competencia)\b/,
    /\b(no confío|desconfío|estafa|queja|reclamo|molest[oa]|enojad[oa]|mal servicio|no me gustó|insatisfech[oa])\b/,
    /\b(cuotas|financiaci[oó]n|a plazos|crédito|pago inicial|separado)\b/,
  ];

  if (señalesDeObjecion.some((patron) => patron.test(texto))) {
    return "avanzado";
  }

  const preguntas = (texto.match(/\?/g) ?? []).length;
  if (preguntas >= 3 || texto.length > 600) {
    return "avanzado";
  }

  return "basico";
}
