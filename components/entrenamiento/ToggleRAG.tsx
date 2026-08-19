"use client";

import { Database } from "lucide-react";

/** Botón tipo pill, sin agregar @radix-ui/react-switch como dependencia
 * nueva — mismo lenguaje visual que SelectorModoModelo/SelectorNivelIA. */
export function ToggleRAG({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (activo: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      title="Activa o desactiva la búsqueda en la base de conocimiento (RAG) para esta prueba."
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
        value
          ? "border-brand-lime/40 bg-brand-lime/10 text-brand-lime"
          : "border-border bg-[#141414] text-[#666] hover:text-[#999]"
      }`}
    >
      <Database className="size-3" />
      RAG {value ? "activo" : "inactivo"}
    </button>
  );
}
