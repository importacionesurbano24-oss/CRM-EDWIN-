import Link from "next/link";
import { Package } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { PedidoConDetalle } from "@/lib/data/pedidos";
import { formatMoneda } from "@/lib/ui/cotizacion";
import { EtapaBadge } from "@/components/pipeline/EtapaBadge";
import type { Etapa } from "@/lib/types";

export function PedidosList({
  pedidos,
  etapaPorCliente,
}: {
  pedidos: PedidoConDetalle[];
  etapaPorCliente: Record<string, Etapa | null>;
}) {
  if (pedidos.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-[#555]">
        Todavía no hay pedidos registrados. Registra el primero con
        &quot;Registrar pedido&quot;.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {pedidos.map((pedido) => (
        <Link
          key={pedido.id}
          href={`/clientes/${pedido.cliente_id}`}
          className="overflow-hidden rounded-[14px] border border-border bg-card transition-colors hover:border-[#2E2E2E]"
        >
          <div className="relative h-[140px] bg-[#1A1A1A]">
            {pedido.fotoSignedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pedido.fotoSignedUrl}
                alt={`Pedido de ${pedido.clienteNombre}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="size-8 text-[#333]" />
              </div>
            )}
            <div className="absolute top-2.5 right-2.5">
              <EtapaBadge etapa={etapaPorCliente[pedido.cliente_id] ?? null} />
            </div>
          </div>
          <div className="p-4">
            <div className="mb-1 text-sm font-semibold text-[#F0F0F0]">
              {pedido.clienteNombre}
            </div>
            <div className="mb-3 text-xs text-[#444]">
              {format(new Date(`${pedido.fecha_compra}T00:00:00`), "d MMM yyyy", {
                locale: es,
              })}
            </div>
            <div className="text-lg font-bold text-brand-lime">
              {formatMoneda(pedido.monto)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
