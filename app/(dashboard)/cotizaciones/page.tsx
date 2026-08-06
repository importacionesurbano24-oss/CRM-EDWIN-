import Link from "next/link";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCotizaciones } from "@/lib/data/cotizaciones";
import { getClientesConEtapa } from "@/lib/data/clientes";
import { CotizacionesList } from "@/components/cotizaciones/CotizacionesList";
import { NuevaCotizacionDialog } from "@/components/cotizaciones/NuevaCotizacionDialog";
import {
  coincideConFiltroCotizacion,
  FILTRO_COTIZACION_META,
  FILTROS_COTIZACION,
  type FiltroCotizacion,
} from "@/lib/ui/cotizacion";

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro } = await searchParams;
  const filtroActivo: FiltroCotizacion | null =
    filtro && (FILTROS_COTIZACION as readonly string[]).includes(filtro)
      ? (filtro as FiltroCotizacion)
      : null;

  const supabase = await createClient();
  const [todasLasCotizaciones, clientes] = await Promise.all([
    getCotizaciones(supabase),
    getClientesConEtapa(supabase),
  ]);

  const cotizaciones = filtroActivo
    ? todasLasCotizaciones.filter((c) =>
        coincideConFiltroCotizacion(c, filtroActivo)
      )
    : todasLasCotizaciones;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-white">
            Cotizaciones
          </h1>
          <p className="mt-0.5 text-[13px] text-[#444]">
            Links públicos que el cliente puede consultar
          </p>
        </div>
        <NuevaCotizacionDialog
          clientes={clientes.map((c) => ({ id: c.id, nombre: c.nombre }))}
        />
      </div>

      {filtroActivo && (
        <Link
          href="/cotizaciones"
          className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          Filtro: {FILTRO_COTIZACION_META[filtroActivo].label}
          <X className="size-3.5" />
        </Link>
      )}

      <CotizacionesList
        cotizaciones={cotizaciones}
        mensajeVacio={
          filtroActivo
            ? `No hay cotizaciones en "${FILTRO_COTIZACION_META[filtroActivo].label}".`
            : undefined
        }
      />
    </div>
  );
}
