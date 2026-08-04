import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Seguimiento } from "@/lib/types";
import { ETAPA_META } from "@/lib/ui/etapa";
import { EtapaBadge } from "./EtapaBadge";

export function HistorialSeguimientos({ items }: { items: Seguimiento[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[#555]">Todavía no hay seguimientos registrados.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3">
          <div className="relative w-0.5 shrink-0 rounded-sm bg-[#1E1E1E]">
            <div
              className="absolute top-0.5 -left-[3px] h-2 w-2 rounded-full"
              style={{ background: ETAPA_META[item.etapa].color }}
            />
          </div>
          <div className="flex-1 pb-1">
            <div className="mb-1 flex items-center gap-2">
              <EtapaBadge etapa={item.etapa} />
              <span className="text-[11px] text-[#444]">
                {format(new Date(item.created_at), "d MMM yyyy, HH:mm", {
                  locale: es,
                })}
              </span>
            </div>
            {item.proxima_accion && (
              <p className="text-[13px] text-[#D0D0D0]">
                Próxima acción: {item.proxima_accion}
                {item.proxima_accion_fecha
                  ? ` (${format(new Date(item.proxima_accion_fecha), "d MMM", { locale: es })})`
                  : ""}
              </p>
            )}
            {item.notas && (
              <p className="mt-1 text-[13px] text-[#888]">{item.notas}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
