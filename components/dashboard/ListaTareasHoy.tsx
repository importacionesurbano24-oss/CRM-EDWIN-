import Link from "next/link";
import type { ClienteConEtapa } from "@/lib/types";
import { calcularUrgencia } from "@/lib/ui/urgencia";
import { ClienteAvatar } from "@/components/pipeline/ClienteAvatar";
import { EtapaBadge } from "@/components/pipeline/EtapaBadge";

export function ListaTareasHoy({ tareas }: { tareas: ClienteConEtapa[] }) {
  if (tareas.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-[#555]">
        No hay seguimientos pendientes para hoy.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {tareas.map((tarea) => {
        const urgencia = calcularUrgencia(tarea.proxima_accion_fecha);
        return (
          <Link
            key={tarea.id}
            href={`/clientes/${tarea.id}`}
            className="flex items-center gap-4 rounded-xl border border-border bg-card px-4.5 py-4 transition-colors hover:border-primary"
          >
            <ClienteAvatar id={tarea.id} nombre={tarea.nombre} size={40} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#F0F0F0]">
                {tarea.nombre}
              </div>
              <div className="mt-0.5 truncate text-xs text-[#555]">
                {tarea.proxima_accion || "Seguimiento pendiente"}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <EtapaBadge etapa={tarea.etapa} />
              <div
                className="mt-1 text-[11px] font-medium"
                style={{ color: urgencia.color }}
              >
                {urgencia.label}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
