import Link from "next/link";
import { FileText } from "lucide-react";
import type { Cotizacion } from "@/lib/types";
import { formatMoneda } from "@/lib/ui/cotizacion";

export function CotizacionActivaCard({
  cotizacion,
}: {
  cotizacion: Cotizacion;
}) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
        <FileText className="size-[15px] text-brand-lime" />
        Cotización activa
      </h2>

      <div className="mb-4 flex flex-col gap-2.5">
        {cotizacion.productos.map((producto, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-[#1E1E1E] bg-background px-3.5 py-2.5"
          >
            <div>
              <div className="text-[13px] font-semibold text-white">
                {producto.nombre}
              </div>
              <div className="mt-0.5 text-[11px] text-[#888]">
                {producto.cantidad} ud. × {formatMoneda(producto.precio_unitario)}
              </div>
            </div>
            <div className="text-[13px] font-bold text-white">
              {formatMoneda(producto.cantidad * producto.precio_unitario)}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3.5 flex items-center justify-between rounded-lg border border-brand-lime bg-brand-lime/10 px-3.5 py-3">
        <span className="text-[13px] font-semibold text-brand-lime">
          Total cotizado
        </span>
        <span className="text-xl font-extrabold tracking-tight text-brand-lime">
          {formatMoneda(cotizacion.monto_total)}
        </span>
      </div>

      <Link
        href={`/cotizacion/${cotizacion.token_publico}`}
        target="_blank"
        className="flex w-full items-center justify-center rounded-lg border border-brand-lime px-3 py-2 text-[12.5px] font-semibold text-brand-lime transition-colors hover:bg-brand-lime/10"
      >
        Ver cotización completa →
      </Link>
    </div>
  );
}
