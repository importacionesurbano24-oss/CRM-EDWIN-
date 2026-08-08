import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getClientesConEtapa } from "@/lib/data/clientes";
import { getUltimosMensajesPorCliente } from "@/lib/data/whatsapp";
import { esPendienteHoy } from "@/lib/ui/urgencia";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CotizacionRealtimeListener } from "@/components/dashboard/CotizacionRealtimeListener";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [clientes, ultimosMensajesWhatsapp] = await Promise.all([
    getClientesConEtapa(supabase),
    getUltimosMensajesPorCliente(supabase),
  ]);

  const mensajesSinResponder = ultimosMensajesWhatsapp.filter(
    (m) => m.direccion === "entrante"
  ).length;

  const pendientesHoy =
    clientes.filter((c) => esPendienteHoy(c.proxima_accion_fecha)).length +
    mensajesSinResponder;

  return (
    <DashboardShell
      sidebar={
        <Sidebar pendientesHoy={pendientesHoy} userEmail={user?.email ?? ""} />
      }
    >
      {children}
      {user && <CotizacionRealtimeListener userId={user.id} />}
    </DashboardShell>
  );
}
