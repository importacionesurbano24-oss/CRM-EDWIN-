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

export const NIVEL_IA_POR_DEFECTO: NivelIA = "avanzado";
