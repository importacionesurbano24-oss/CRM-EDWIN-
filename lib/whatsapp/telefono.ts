/** Deja solo los dígitos de un número de teléfono, sin +, espacios ni guiones. */
export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/**
 * Compara dos números ignorando formato/indicativo de país — Meta manda el
 * número en formato E.164 sin "+" (ej. "573112345665"), mientras que en
 * clientes.telefono_whatsapp Edwin lo escribe como quiera ("+57 311 246
 * 5665", "3112465665", etc.). Se comparan los últimos 10 dígitos (número
 * local colombiano sin indicativo de país).
 */
export function mismoTelefono(a: string, b: string): boolean {
  const da = soloDigitos(a);
  const db = soloDigitos(b);
  if (da.length < 7 || db.length < 7) return false;
  return da.slice(-10) === db.slice(-10);
}

/**
 * Normaliza a formato E.164 con "+" — lo que la Cloud API de Meta pide
 * explícitamente para el campo "to" al enviar. Si el número ya trae
 * indicativo de país (más de 10 dígitos, como llega desde el webhook de
 * Meta), solo se le agrega el "+". Si es un número local colombiano de 10
 * dígitos (como Edwin lo escribe a mano), se le agrega +57.
 */
export function formatoE164(telefono: string): string {
  const digitos = soloDigitos(telefono);
  return digitos.length > 10 ? `+${digitos}` : `+57${digitos}`;
}
