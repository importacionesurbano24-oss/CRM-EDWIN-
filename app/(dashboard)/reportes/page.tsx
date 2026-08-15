import { createClient } from "@/lib/supabase/server";
import { getClientesConEtapa, getTodosLosSeguimientos } from "@/lib/data/clientes";
import {
  getPedidosReporte,
  getCotizacionesReporte,
  getMensajesWhatsappReporte,
} from "@/lib/data/reportes";
import { getUltimosMensajesPorCliente } from "@/lib/data/whatsapp";
import { generarAlertasBriefing } from "@/lib/services/briefing.service";
import { resolverRangoPeriodo } from "@/lib/services/reportes.service";
import { PanelInformes } from "@/components/reportes/PanelInformes";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string }>;
}) {
  const { periodo, desde, hasta } = await searchParams;
  const rango = resolverRangoPeriodo(periodo, desde, hasta);

  const supabase = await createClient();
  const [clientes, pedidos, cotizaciones, seguimientos, mensajesWhatsapp, ultimosMensajesWhatsapp] =
    await Promise.all([
      getClientesConEtapa(supabase),
      getPedidosReporte(supabase),
      getCotizacionesReporte(supabase),
      getTodosLosSeguimientos(supabase),
      getMensajesWhatsappReporte(supabase),
      getUltimosMensajesPorCliente(supabase),
    ]);

  const alertasBriefing = generarAlertasBriefing(clientes, ultimosMensajesWhatsapp);

  return (
    <PanelInformes
      clientes={clientes}
      pedidos={pedidos}
      cotizaciones={cotizaciones}
      seguimientos={seguimientos}
      mensajesWhatsapp={mensajesWhatsapp}
      alertasBriefing={alertasBriefing}
      rango={rango}
      periodo={periodo}
      desde={desde}
      hasta={hasta}
    />
  );
}
