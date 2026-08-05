import { createClient } from "@/lib/supabase/server";
import { getCotizaciones } from "@/lib/data/cotizaciones";
import { getClientesConEtapa } from "@/lib/data/clientes";
import { CotizacionesList } from "@/components/cotizaciones/CotizacionesList";
import { NuevaCotizacionDialog } from "@/components/cotizaciones/NuevaCotizacionDialog";

export default async function CotizacionesPage() {
  const supabase = await createClient();
  const [cotizaciones, clientes] = await Promise.all([
    getCotizaciones(supabase),
    getClientesConEtapa(supabase),
  ]);

  return (
    <div className="flex-1 overflow-y-auto px-9 py-8">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-white">
            Cotizaciones
          </h1>
          <p className="mt-0.5 text-[13px] text-[#444]">
            Links públicos que el cliente puede consultar
          </p>
        </div>
        <NuevaCotizacionDialog
          clientes={clientes.map((c) => ({ id: c.id, nombre: c.nombre }))}
        />
      </div>

      <CotizacionesList cotizaciones={cotizaciones} />
    </div>
  );
}
