/**
 * Nota que el webhook (app/api/whatsapp/webhook/route.ts) guarda en el
 * primer seguimiento de un cliente creado automáticamente por un mensaje
 * entrante. Se comparte acá (en vez de repetir el string literal) porque
 * lib/services/reportes.service.ts la necesita para atribuir leads al
 * agente en "Rendimiento del agente IA" — un solo lugar de verdad.
 */
export const NOTA_LEAD_AUTOMATICO_WHATSAPP =
  "Cliente creado automáticamente por un mensaje de WhatsApp entrante.";
