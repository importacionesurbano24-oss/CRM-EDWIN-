import { ETAPA_META, etapaBg } from "@/lib/ui/etapa";
import type { Etapa } from "@/lib/types";

export function EtapaBadge({ etapa }: { etapa: Etapa | null }) {
  if (!etapa) {
    return (
      <span className="inline-flex items-center rounded-full bg-[#1A1A1A] px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-[#555]">
        Sin etapa
      </span>
    );
  }

  const meta = ETAPA_META[etapa];

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: etapaBg(meta.color), color: meta.color }}
    >
      {meta.label}
    </span>
  );
}
