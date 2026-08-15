import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getClienteConEtapa,
  getHistorialCliente,
} from "@/lib/data/clientes";
import { getHistorialChat } from "@/lib/data/chat";
import { getMensajesWhatsapp } from "@/lib/data/whatsapp";
import { ClienteAvatar } from "@/components/pipeline/ClienteAvatar";
import { BotonVolver } from "@/components/pipeline/BotonVolver";
import { EtapaBadge } from "@/components/pipeline/EtapaBadge";
import { BotonEnviarWhatsApp } from "@/components/clientes/BotonEnviarWhatsApp";
import { RegistrarSeguimientoForm } from "@/components/pipeline/RegistrarSeguimientoForm";
import { HistorialSeguimientos } from "@/components/pipeline/HistorialSeguimientos";
import { ChatAgente } from "@/components/pipeline/ChatAgente";
import { HiloWhatsapp } from "@/components/pipeline/HiloWhatsapp";
import { BannerModoEnfoque } from "@/components/pipeline/BannerModoEnfoque";

const ORIGEN_LABEL: Record<string, string> = {
  "walk-in": "Llegó a la tienda",
  referido: "Referido",
  otro: "Otro",
};

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

  const historial = await getHistorialCliente(supabase, id);
  const historialChat = await getHistorialChat(supabase, id);
  const mensajesWhatsapp = await getMensajesWhatsapp(supabase, id);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <BotonVolver texto="Volver a clientes" rutaFallback="/clientes" />

      {volver === "enfoque" && <BannerModoEnfoque vistos={vistos} total={total} />}

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <ClienteAvatar id={cliente.id} nombre={cliente.nombre} size={52} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight text-white">
            {cliente.nombre}
          </h1>
          <p className="mt-0.5 text-sm text-[#555]">
            {cliente.telefono_whatsapp}
            {cliente.email ? ` · ${cliente.email}` : ""} ·{" "}
            {ORIGEN_LABEL[cliente.origen] ?? cliente.origen}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <EtapaBadge etapa={cliente.etapa} />
          <BotonEnviarWhatsApp
            clienteId={cliente.id}
            clienteNombre={cliente.nombre}
            telefono={cliente.telefono_whatsapp}
          />
        </div>
      </div>

      <div className="mb-6">
        <ChatAgente
          clienteId={cliente.id}
          clienteNombre={cliente.nombre}
          historialInicial={historialChat}
        />
      </div>

      <div className="mb-6">
        <HiloWhatsapp clienteId={cliente.id} mensajesIniciales={mensajesWhatsapp} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[14px] border border-border bg-card p-6">
          <h2 className="mb-4 text-xs font-semibold tracking-wide text-[#555] uppercase">
            Registrar seguimiento
          </h2>
          <RegistrarSeguimientoForm
            clienteId={cliente.id}
            etapaActual={cliente.etapa}
          />
        </div>

        <div className="rounded-[14px] border border-border bg-card p-6">
          <h2 className="mb-4 text-xs font-semibold tracking-wide text-[#555] uppercase">
            Historial
          </h2>
          <HistorialSeguimientos items={historial} />
        </div>
      </div>
    </div>
  );
}
