import type { Etapa } from "@/lib/types";

export const ETAPA_META: Record<Etapa, { label: string; color: string }> = {
  prospecto: { label: "Prospecto", color: "#555555" },
  cotizo: { label: "Cotizó", color: "#FFDD00" },
  compro: { label: "Compró", color: "#CCFF00" },
  posventa: { label: "Posventa", color: "#6BDDFF" },
  referido_solicitado: { label: "Referido", color: "#FF9F43" },
};

export const ETAPA_ORDEN: Etapa[] = [
  "prospecto",
  "cotizo",
  "compro",
  "posventa",
  "referido_solicitado",
];

/** Fondo tenue del mismo tono para usar detrás del color sólido (badges, tags). */
export function etapaBg(color: string) {
  return `${color}22`;
}
