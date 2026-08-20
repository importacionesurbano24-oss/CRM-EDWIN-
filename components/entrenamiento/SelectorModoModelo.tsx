"use client";

import { Zap, Target, Wand2 } from "lucide-react";
import type { NivelIA } from "@/lib/claude/modelos";

export type ModoModelo = NivelIA | "auto";

const OPCIONES: {
  valor: ModoModelo;
  label: string;
  titulo: string;
  icono: typeof Zap;
}[] = [
  {
    valor: "basico",
    label: "Haiku",
    titulo: "Fuerza el modelo básico (Haiku) en toda la prueba.",
    icono: Zap,
  },
  {
    valor: "avanzado",
    label: "Sonnet",
    titulo: "Fuerza el modelo avanzado (Sonnet) en toda la prueba.",
    icono: Target,
  },
  {
    valor: "auto",
    label: "Automático",
    titulo:
      "Corre la heurística real de escalado y muestra la razón en el panel de debug.",
    icono: Wand2,
  },
];

/** Igual en estilo a SelectorNivelIA (components/shared), pero con un
 * tercer modo "auto" y estado siempre local — nunca el hook useNivelIA
 * global, porque forzar un modelo en pruebas no debe filtrarse al chat
 * real de Edwin en otras pantallas. */
export function SelectorModoModelo({
  value,
  onChange,
}: {
  value: ModoModelo;
  onChange: (modo: ModoModelo) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-[#141414] p-0.5">
      {OPCIONES.map(({ valor, label, titulo, icono: Icono }) => (
        <button
          key={valor}
          type="button"
          title={titulo}
          onClick={() => onChange(valor)}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
            value === valor
              ? "bg-[#222] text-[#F0F0F0]"
              : "text-[#666] hover:text-[#999]"
          }`}
        >
          <Icono className="size-3" />
          {label}
        </button>
      ))}
    </div>
  );
}
