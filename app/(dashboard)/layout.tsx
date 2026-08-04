import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getClientesConEtapa } from "@/lib/data/clientes";
import { esPendienteHoy } from "@/lib/ui/urgencia";
import { Sidebar } from "@/components/dashboard/Sidebar";

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
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar pendientesHoy={pendientesHoy} userEmail={user?.email ?? ""} />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
