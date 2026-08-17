import { notFound } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import {
  getClienteConEtapa,
  getHistorialCliente,
} from "@/lib/data/clientes";
import { getHistorialChat } from "@/lib/data/chat";
import { getMensajesWhatsapp } from "@/lib/data/whatsapp";
import { getCotizaciones } from "@/lib/data/cotizaciones";
import { ClienteHeaderCard } from "@/components/pipeline/ClienteHeaderCard";
import { CotizacionActivaCard } from "@/components/pipeline/CotizacionActivaCard";
import { BotonVolver } from "@/components/pipeline/BotonVolver";
import { RegistrarSeguimientoForm } from "@/components/pipeline/RegistrarSeguimientoForm";
import { HistorialSeguimientos } from "@/components/pipeline/HistorialSeguimientos";
import { ChatAgente } from "@/components/pipeline/ChatAgente";
import { HiloWhatsapp } from "@/components/pipeline/HiloWhatsapp";
import { BannerModoEnfoque } from "@/components/pipeline/BannerModoEnfoque";

export default async function ClienteDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ volver?: string; vistos?: string; total?: string }>;
}) {
  const { id } = await params;
  const { volver, vistos, total } = await searchParams;
  const supabase = await createClient();

  const cliente = await getClienteConEtapa(supabase, id);
  if (!cliente) notFound();

  const [historial, historialChat, mensajesWhatsapp, cotizaciones] =
    await Promise.all([
      getHistorialCliente(supabase, id),
      getHistorialChat(supabase, id),
      getMensajesWhatsapp(supabase, id),
      getCotizaciones(supabase),
    ]);

  const cotizacionesCliente = cotizaciones.filter((c) => c.cliente_id === id);
  const cotizacionActiva = cotizacionesCliente[0] ?? null; // ya viene ordenado por created_at desc
  const diasSinContacto = differenceInCalendarDays(
    new Date(),
    new Date(historial[0]?.created_at ?? cliente.created_at)
  );

  return (
    <div className="flex-1 scroll-smooth overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <BotonVolver texto="Volver a clientes" rutaFallback="/clientes" />

      {volver === "enfoque" && <BannerModoEnfoque vistos={vistos} total={total} />}

      <ClienteHeaderCard
        cliente={cliente}
        montoCotizado={cotizacionActiva ? cotizacionActiva.monto_total : null}
        diasSinContacto={diasSinContacto}
        totalSeguimientos={historial.length}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[3fr_2fr] lg:items-start">
        {/* Columna izquierda: interacción */}
        <div className="flex flex-col gap-5">
          <ChatAgente
            clienteId={cliente.id}
            clienteNombre={cliente.nombre}
            historialInicial={historialChat}
          />

          <HiloWhatsapp clienteId={cliente.id} mensajesIniciales={mensajesWhatsapp} />

          <div
            id="seguimiento"
            className="scroll-mt-6 rounded-[14px] border border-border bg-card p-6"
          >
            <h2 className="mb-4 text-sm font-bold text-white">
              Registrar seguimiento
            </h2>
            <RegistrarSeguimientoForm
              clienteId={cliente.id}
              etapaActual={cliente.etapa}
            />
          </div>
        </div>

        {/* Columna derecha: registro */}
        <div className="flex flex-col gap-5">
          <div className="rounded-[14px] border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-bold text-white">
              Historial de contactos
            </h2>
            <HistorialSeguimientos items={historial} />
          </div>

          {cotizacionActiva && (
            <CotizacionActivaCard cotizacion={cotizacionActiva} />
          )}
        </div>
      </div>
    </div>
  );
}
