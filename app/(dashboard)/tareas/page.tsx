import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getClientesConEtapa } from "@/lib/data/clientes";
import { getUltimosMensajesPorCliente } from "@/lib/data/whatsapp";
import { esPendienteHoy } from "@/lib/ui/urgencia";
import { generarAlertasBriefing } from "@/lib/services/briefing.service";
import { BriefingDelDia } from "@/components/dashboard/BriefingDelDia";
import { ListaTareasHoy } from "@/components/dashboard/ListaTareasHoy";

export default async function TareasPage() {
  const supabase = await createClient();
  const [clientes, ultimosMensajesWhatsapp] = await Promise.all([
    getClientesConEtapa(supabase),
    getUltimosMensajesPorCliente(supabase),
  ]);

  const tareasHoy = clientes.filter((c) => esPendienteHoy(c.proxima_accion_fecha));
  const alertasBriefing = generarAlertasBriefing(clientes, ultimosMensajesWhatsapp);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-[28px]">
            Tareas de hoy
          </h1>
          <p className="mt-1 text-sm text-[#555]">
            Todo lo que toca atender hoy, más lo que la IA detecta que se está
            quedando frío.
          </p>
        </div>
        <Link
          href="/enfoque"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Empezar mi día
          <ArrowRight className="size-4" />
        </Link>
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
