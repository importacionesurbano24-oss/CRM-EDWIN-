"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Vuelve a la página anterior real del historial del navegador (no a una
 * ruta fija) — así se respeta el filtro/vista/scroll que tenía el usuario
 * antes de entrar. Si no hay historial (ej. se abrió el link directo),
 * cae a `rutaFallback`.
 */
export function BotonVolver({
  texto,
  rutaFallback,
}: {
  texto: string;
  rutaFallback: string;
}) {
  const router = useRouter();

  function volver() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(rutaFallback);
    }
  }

  return (
    <button
      type="button"
      onClick={volver}
      className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-[#666] hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" />
      {texto}
    </button>
  );
}
