import { createClient } from "@/lib/supabase/server";
import { getPedidos } from "@/lib/data/pedidos";
import { getClientesConEtapa } from "@/lib/data/clientes";
import { getCotizaciones } from "@/lib/data/cotizaciones";
import { PedidosList } from "@/components/pedidos/PedidosList";
import { RegistrarPedidoDialog } from "@/components/pedidos/RegistrarPedidoDialog";
import type { Etapa } from "@/lib/types";

export default async function PedidosPage() {
  const supabase = await createClient();
  const [pedidos, clientes, cotizaciones] = await Promise.all([
    getPedidos(supabase),
    getClientesConEtapa(supabase),
    getCotizaciones(supabase),
  ]);

  const etapaPorCliente: Record<string, Etapa | null> = {};
  for (const c of clientes) etapaPorCliente[c.id] = c.etapa;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-white">
            Pedidos
          </h1>
          <p className="mt-0.5 text-[13px] text-[#444]">
            Registro de ventas con foto del pedido
          </p>
        </div>
        <RegistrarPedidoDialog
          clientes={clientes.map((c) => ({ id: c.id, nombre: c.nombre }))}
          cotizaciones={cotizaciones.map((c) => ({
            id: c.id,
            cliente_id: c.cliente_id,
            monto_total: c.monto_total,
          }))}
        />
      </div>

      <PedidosList pedidos={pedidos} etapaPorCliente={etapaPorCliente} />
    </div>
  );
}
