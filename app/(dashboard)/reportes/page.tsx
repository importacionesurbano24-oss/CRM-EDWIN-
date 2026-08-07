import { createClient } from "@/lib/supabase/server";
import { getClientesConEtapa } from "@/lib/data/clientes";
import { getPedidosReporte } from "@/lib/data/reportes";
import { esPeriodoValido, type Periodo } from "@/lib/services/reportes.service";
import { PanelInformes } from "@/components/reportes/PanelInformes";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo } = await searchParams;
  const dias = (esPeriodoValido(periodo) ? Number(periodo) : 30) as Periodo;

  const supabase = await createClient();
  const [clientes, pedidos] = await Promise.all([
    getClientesConEtapa(supabase),
    getPedidosReporte(supabase),
  ]);

  return <PanelInformes clientes={clientes} pedidos={pedidos} dias={dias} />;
}
