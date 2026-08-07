import { createClient } from "@/lib/supabase/server";
import { getClientesConEtapa } from "@/lib/data/clientes";
import { ClientesView } from "@/components/pipeline/ClientesView";
import { coincideRangoFecha, esRangoFechaValido } from "@/lib/ui/rangoFecha";
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
  searchParams: Promise<{
    etapa?: string;
    rango?: string;
    desde?: string;
    hasta?: string;
  }>;
}) {
  const { etapa, rango, desde, hasta } = await searchParams;
  const filtroEtapas = (etapa?.split(",") ?? []).filter((e): e is Etapa =>
    ETAPAS_VALIDAS.includes(e as Etapa)
  );
  const rangoFecha = esRangoFechaValido(rango) ? rango : "todos";

  const supabase = await createClient();
  const todosLosClientes = await getClientesConEtapa(supabase);

  const clientes = todosLosClientes
    .filter((c) => filtroEtapas.length === 0 || (c.etapa && filtroEtapas.includes(c.etapa)))
    .filter((c) =>
      coincideRangoFecha(c.proxima_accion_fecha, rangoFecha, desde, hasta)
    );

  return (
    <ClientesView
      key={filtroEtapas.join(",")}
      clientes={clientes}
      filtroEtapas={filtroEtapas}
    />
  );
}
