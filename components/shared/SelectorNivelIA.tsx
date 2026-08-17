"use client";

import { Zap, Target } from "lucide-react";
import type { NivelIA } from "@/lib/claude/modelos";

const OPCIONES: {
  valor: NivelIA;
  label: string;
  titulo: string;
  icono: typeof Zap;
}[] = [
  {
    valor: "basico",
    label: "Rápido",
    titulo: "Modelo básico — más rápido y económico, para respuestas simples.",
    icono: Zap,
  },
  {
    valor: "avanzado",
    label: "Preciso",
    titulo: "Modelo avanzado — piensa mejor con más contexto, para casos delicados.",
    icono: Target,
  },
];

/** Selector chico del nivel de IA (básico/avanzado), para poner junto a cada botón que dispara una llamada a Claude. */
export function SelectorNivelIA({
  value,
  onChange,
}: {
  value: NivelIA;
  onChange: (nivel: NivelIA) => void;
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
