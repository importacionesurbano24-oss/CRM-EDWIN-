import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CotizacionConCliente } from "@/lib/data/cotizaciones";
import {
  ESTADO_COTIZACION_META,
  estadoBg,
  estadoEfectivo,
  formatMoneda,
} from "@/lib/ui/cotizacion";
import { CopiarLinkButton } from "./CopiarLinkButton";
import { MarcarAceptadaButton } from "./MarcarAceptadaButton";

export function CotizacionesList({
  cotizaciones,
}: {
  cotizaciones: CotizacionConCliente[];
}) {
  if (cotizaciones.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-[#555]">
        Todavía no hay cotizaciones. Crea la primera con &quot;Nueva
        cotización&quot;.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {cotizaciones.map((cot) => {
        const estado = estadoEfectivo(cot);
        const meta = ESTADO_COTIZACION_META[estado];

        return (
          <div
            key={cot.id}
            className="grid grid-cols-[1fr_140px_120px_100px_auto] items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-[#2E2E2E]"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[#F0F0F0]">
                {cot.clienteNombre}
              </div>
              <div className="mt-0.5 font-mono text-xs text-[#444]">
                {cot.token_publico.slice(0, 8)}
              </div>
            </div>
            <div className="text-[15px] font-bold text-white">
              {formatMoneda(cot.monto_total)}
            </div>
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: estadoBg(meta.color), color: meta.color }}
              >
                <span
                  className="h-[5px] w-[5px] rounded-full"
                  style={{ background: meta.color }}
                />
                {meta.label}
              </span>
            </div>
            <div className="text-xs text-[#555]">
              {format(new Date(cot.created_at), "d MMM yyyy", { locale: es })}
            </div>
            <div className="flex items-center justify-end gap-2">
              {estado !== "aceptada" && estado !== "vencida" && (
                <MarcarAceptadaButton cotizacionId={cot.id} />
              )}
              <CopiarLinkButton token={cot.token_publico} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
