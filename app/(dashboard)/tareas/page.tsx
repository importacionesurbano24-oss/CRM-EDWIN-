import { createClient } from "@/lib/supabase/server";
import { getClientesConEtapa } from "@/lib/data/clientes";
import { esPendienteHoy } from "@/lib/ui/urgencia";
import { generarAlertasBriefing } from "@/lib/services/briefing.service";
import { BriefingDelDia } from "@/components/dashboard/BriefingDelDia";
import { ListaTareasHoy } from "@/components/dashboard/ListaTareasHoy";

export default async function TareasPage() {
  const supabase = await createClient();
  const clientes = await getClientesConEtapa(supabase);

  const tareasHoy = clientes.filter((c) => esPendienteHoy(c.proxima_accion_fecha));
  const alertasBriefing = generarAlertasBriefing(clientes);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-[28px]">
          Tareas de hoy
        </h1>
        <p className="mt-1 text-sm text-[#555]">
          Todo lo que toca atender hoy, más lo que la IA detecta que se está
          quedando frío.
        </p>
      </div>

      <BriefingDelDia alertas={alertasBriefing} />

      <div className="mb-4 flex items-center gap-2.5">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <h2 className="text-sm font-semibold tracking-wide text-[#888] uppercase">
          Hoy toca ({tareasHoy.length})
        </h2>
      </div>
      <ListaTareasHoy tareas={tareasHoy} />
    </div>
  );
}
