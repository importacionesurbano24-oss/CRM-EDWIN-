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

// Patrones de objeción compartidos por decidirNivelIA y explicarNivelIA — un
// solo lugar para que las dos funciones no se desalineen si se ajustan las
// reglas más adelante.
const SEÑALES_DE_OBJECION: { patron: RegExp; razon: string }[] = [
  {
    patron: /\b(descuento|rebaja|muy car[oa]|carísim[oa])\b/,
    razon: "El mensaje menciona precio, descuento o queja de que está caro.",
  },
  {
    patron: /\b(otra marca|otra tienda|más barato|competencia)\b/,
    razon: "El mensaje compara con otra marca, tienda o la competencia.",
  },
  {
    patron: /\b(no confío|desconfío|estafa|queja|reclamo|molest[oa]|enojad[oa]|mal servicio|no me gustó|insatisfech[oa])\b/,
    razon: "El mensaje muestra desconfianza o una queja.",
  },
  {
    patron: /\b(cuotas|financiaci[oó]n|a plazos|crédito|pago inicial|separado)\b/,
    razon: "El mensaje pregunta por forma de pago o financiación.",
  },
];

/**
 * Heurística de fallback — solo para interacción directa con clientes
 * (agente.ts, chat.ts, whatsapp.ts). Devuelve "avanzado" si el texto
 * muestra señales de objeción o negociación: dudas de precio/descuento,
 * comparación con otra marca o "está muy caro", desconfianza o quejas,
 * negociación de forma de pago/financiación, o un mensaje largo con
 * varias preguntas encadenadas. Para todo lo demás devuelve "basico".
 */
export function decidirNivelIA(mensaje: string): NivelIA {
  return explicarNivelIA(mensaje).nivel;
}

/**
 * Igual que decidirNivelIA, pero además devuelve por qué se eligió ese
 * nivel. Lo usa el panel de debug de /entrenamiento cuando el modo de
 * modelo es "Automático", para mostrarle a Edwin la razón del escalado.
 */
export function explicarNivelIA(mensaje: string): { nivel: NivelIA; razon: string } {
  const texto = mensaje.toLowerCase();

  const señal = SEÑALES_DE_OBJECION.find(({ patron }) => patron.test(texto));
  if (señal) {
    return { nivel: "avanzado", razon: señal.razon };
  }

  const preguntas = (texto.match(/\?/g) ?? []).length;
  if (preguntas >= 3) {
    return { nivel: "avanzado", razon: "El mensaje encadena 3 o más preguntas." };
  }
  if (texto.length > 600) {
    return { nivel: "avanzado", razon: "El mensaje es largo (más de 600 caracteres)." };
  }

  return { nivel: "basico", razon: "No se detectaron señales de objeción ni negociación." };
}
