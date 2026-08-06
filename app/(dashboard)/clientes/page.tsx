import { createClient } from "@/lib/supabase/server";
import { getClientesConEtapa } from "@/lib/data/clientes";
import { ClientesView } from "@/components/pipeline/ClientesView";
import type { Etapa } from "@/lib/types";

const ETAPAS_VALIDAS: Etapa[] = [
  "prospecto",
  "cotizo",
  "compro",
  "posventa",
  "referido_solicitado",
];

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ etapa?: string }>;
}) {
  const { etapa } = await searchParams;
  const filtroEtapas = (etapa?.split(",") ?? []).filter((e): e is Etapa =>
    ETAPAS_VALIDAS.includes(e as Etapa)
  );

  const supabase = await createClient();
  const todosLosClientes = await getClientesConEtapa(supabase);

  const clientes =
    filtroEtapas.length > 0
      ? todosLosClientes.filter(
          (c) => c.etapa && filtroEtapas.includes(c.etapa)
        )
      : todosLosClientes;

  return <ClientesView clientes={clientes} filtroEtapas={filtroEtapas} />;
}
