import type { MensajeWhatsapp } from "@/lib/types";

const VEINTICUATRO_HORAS_MS = 24 * 60 * 60 * 1000;

/**
 * La Cloud API de Meta solo permite mensajes libres dentro de las 24h
 * desde el último mensaje que mandó el cliente — fuera de eso hace falta
 * una plantilla pre-aprobada (no implementado). Se calcula acá para
 * bloquear el envío con un aviso claro antes de que Meta lo rechace.
 */
export function dentroDeVentana24h(
  hilo: Pick<MensajeWhatsapp, "direccion" | "created_at">[]
): boolean {
  const ultimoEntrante = [...hilo].reverse().find((m) => m.direccion === "entrante");
  if (!ultimoEntrante) return false;

  const transcurrido = Date.now() - new Date(ultimoEntrante.created_at).getTime();
  return transcurrido < VEINTICUATRO_HORAS_MS;
}
