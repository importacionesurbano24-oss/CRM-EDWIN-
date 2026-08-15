import { formatMoneda } from "@/lib/ui/cotizacion";
import type { EtapaEmbudo } from "@/lib/services/reportes.service";

/** Embudo acumulativo — cuántos clientes llegaron al menos a cada etapa, con el valor cotizado asociado. */
export function EmbudoVentas({ etapas }: { etapas: EtapaEmbudo[] }) {
  const max = Math.max(1, ...etapas.map((e) => e.cantidad));

  return (
    <div className="flex flex-col gap-3">
      {etapas.map((e) => (
        <div key={e.etapa} className="flex items-center gap-3">
          <div className="w-[100px] shrink-0 text-[13px] text-[#888]">{e.label}</div>
          <div className="h-8 min-w-0 flex-1 overflow-hidden rounded-md bg-[#1A1A1A]">
            <div
              className="flex h-full items-center rounded-md px-3 text-[12px] font-semibold text-black transition-all"
              style={{
                width: `${Math.max(8, (e.cantidad / max) * 100)}%`,
                background: e.color,
              }}
            >
              {e.cantidad}
            </div>
          </div>
          <div className="w-[110px] shrink-0 text-right text-[12px] text-[#666]">
            {formatMoneda(e.valor)}
          </div>
        </div>
      ))}
    </div>
  );
}
