"use client";

/**
 * Cuando se despliega una versión nueva mientras alguien tiene la página
 * abierta, las Server Actions de la versión vieja dejan de existir en el
 * servidor y Next.js tira "Failed to find Server Action" /
 * "was not found on the server" al invocarlas — sin manejar esto, el
 * botón que la llamó se queda colgado (pending) para siempre, porque la
 * promesa nunca resuelve ni se atrapa. Se detecta este caso puntual para
 * recargar la página sola en vez de dejar un botón roto sin explicación.
 */
export function esAccionDesactualizada(error: unknown): boolean {
  return (
    error instanceof Error &&
    /failed to find server action|was not found on the server/i.test(error.message)
  );
}

export function recargarPorAccionVieja() {
  window.location.reload();
}
