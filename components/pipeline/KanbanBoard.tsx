import type { ClienteConEtapa } from "@/lib/types";
import { ETAPA_META, ETAPA_ORDEN, etapaBg } from "@/lib/ui/etapa";
import { KanbanCard } from "./KanbanCard";

export function KanbanBoard({ clientes }: { clientes: ClienteConEtapa[] }) {
  return (
    <div className="flex flex-1 items-start gap-4 overflow-x-auto px-4 pb-6 md:px-9">
      {ETAPA_ORDEN.map((etapa) => {
        const meta = ETAPA_META[etapa];
        const items = clientes.filter((c) =>
          etapa === "prospecto"
            ? !c.etapa || c.etapa === etapa
            : c.etapa === etapa
        );

        return (
          <div
            key={etapa}
            className="flex w-[240px] min-w-[240px] shrink-0 flex-col gap-2.5"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: meta.color }}
                />
                <span className="text-xs font-semibold tracking-wide text-[#888] uppercase">
                  {meta.label}
                </span>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-bold"
                style={{ background: etapaBg(meta.color), color: meta.color }}
              >
                {items.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {items.map((cliente) => (
                <KanbanCard key={cliente.id} cliente={cliente} />
              ))}
              {items.length === 0 && (
                <div className="rounded-[10px] border border-dashed border-[#1E1E1E] p-4 text-center text-[11px] text-[#333]">
                  Vacío
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
