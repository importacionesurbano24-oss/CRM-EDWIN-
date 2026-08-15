import Link from "next/link";
import { textoPlantilla, type AlertaBriefing } from "@/lib/services/briefing.service";
import { ETAPA_META } from "@/lib/ui/etapa";

/** Vista de solo lectura de las alertas del Briefing — accionarlas se sigue haciendo en /tareas. */
export function OportunidadesSinSeguimiento({ alertas }: { alertas: AlertaBriefing[] }) {
  if (alertas.length === 0) {
    return (
      <p className="text-[13px] text-[#555]">
        No hay oportunidades estancadas ahora mismo.
      </p>
    );
  }

  const visibles = alertas.slice(0, 8);

  return (
    <div className="flex flex-col gap-2">
      {visibles.map((alerta) => {
        const { situacion } = textoPlantilla(alerta);
        return (
          <Link
            key={alerta.clienteId}
            href={`/clientes/${alerta.clienteId}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-[#141414] px-3.5 py-2.5 transition-colors hover:border-primary"
          >
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-[#F0F0F0]">
                {alerta.clienteNombre}
              </div>
              <div className="truncate text-[12px] text-[#666]">{situacion}</div>
            </div>
            <span className="shrink-0 text-[11px] text-[#555]">
              {ETAPA_META[alerta.etapaActual].label}
            </span>
          </Link>
        );
      })}
      {alertas.length > visibles.length && (
        <Link
          href="/tareas"
          className="mt-1 text-center text-[12px] text-primary hover:underline"
        >
          Ver las {alertas.length} en Tareas →
        </Link>
      )}
    </div>
  );
}
