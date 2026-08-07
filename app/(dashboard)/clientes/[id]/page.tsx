import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getClienteConEtapa,
  getHistorialCliente,
} from "@/lib/data/clientes";
import { getHistorialChat } from "@/lib/data/chat";
import { ClienteAvatar } from "@/components/pipeline/ClienteAvatar";
import { EtapaBadge } from "@/components/pipeline/EtapaBadge";
import { RegistrarSeguimientoForm } from "@/components/pipeline/RegistrarSeguimientoForm";
import { HistorialSeguimientos } from "@/components/pipeline/HistorialSeguimientos";
import { ChatAgente } from "@/components/pipeline/ChatAgente";

const ORIGEN_LABEL: Record<string, string> = {
  "walk-in": "Llegó a la tienda",
  referido: "Referido",
  otro: "Otro",
};

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const cliente = await getClienteConEtapa(supabase, id);
  if (!cliente) notFound();

  const historial = await getHistorialCliente(supabase, id);
  const historialChat = await getHistorialChat(supabase, id);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <Link
        href="/clientes"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-[#666] hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Volver a clientes
      </Link>

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
        <EtapaBadge etapa={cliente.etapa} />
      </div>

      <div className="mb-6">
        <ChatAgente
          clienteId={cliente.id}
          clienteNombre={cliente.nombre}
          historialInicial={historialChat}
        />
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
