import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getClientesConEtapa } from "@/lib/data/clientes";
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

  const clientes = await getClientesConEtapa(supabase);
  const pendientesHoy = clientes.filter((c) =>
    esPendienteHoy(c.proxima_accion_fecha)
  ).length;

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
