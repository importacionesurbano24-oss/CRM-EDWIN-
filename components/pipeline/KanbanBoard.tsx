import Link from "next/link";
import type { ClienteConEtapa } from "@/lib/types";
import { ETAPA_META, ETAPA_ORDEN, etapaBg } from "@/lib/ui/etapa";
import { calcularUrgencia } from "@/lib/ui/urgencia";
import { ClienteAvatar } from "./ClienteAvatar";

export function KanbanBoard({ clientes }: { clientes: ClienteConEtapa[] }) {
  return (
    <div className="flex flex-1 items-start gap-4 overflow-x-auto px-9 pb-6">
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
              {items.map((cliente) => {
                const urgencia = calcularUrgencia(
                  cliente.proxima_accion_fecha
                );
                return (
                  <Link
                    key={cliente.id}
                    href={`/clientes/${cliente.id}`}
                    className="rounded-[10px] border border-border bg-card p-3.5 transition-colors hover:border-[#2E2E2E] hover:bg-[#141414]"
                  >
                    <div className="mb-2.5 flex items-center gap-2.5">
                      <ClienteAvatar id={cliente.id} nombre={cliente.nombre} />
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold text-[#F0F0F0]">
                          {cliente.nombre}
                        </div>
                        <div className="text-[11px] text-[#444]">
                          {cliente.telefono_whatsapp}
                        </div>
                      </div>
                    </div>
                    <div className="mb-2.5 line-clamp-2 text-xs text-[#555]">
                      {cliente.proxima_accion || "Sin próxima acción"}
                    </div>
                    <div
                      className="text-[11px] font-semibold"
                      style={{ color: urgencia.color }}
                    >
                      {urgencia.label}
                    </div>
                  </Link>
                );
              })}
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
