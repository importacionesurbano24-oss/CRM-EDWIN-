import { createClient } from "@/lib/supabase/server";
import { getClientesConEtapa } from "@/lib/data/clientes";
import { ClientesView } from "@/components/pipeline/ClientesView";

export default async function ClientesPage() {
  const supabase = await createClient();
  const clientes = await getClientesConEtapa(supabase);

  return <ClientesView clientes={clientes} />;
}
