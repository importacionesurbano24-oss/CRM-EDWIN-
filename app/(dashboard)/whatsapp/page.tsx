import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getUltimosMensajesPorCliente, getMensajesWhatsapp } from "@/lib/data/whatsapp";
import { getClienteConEtapa } from "@/lib/data/clientes";
import { PanelConversacionWhatsapp } from "@/components/whatsapp/PanelConversacionWhatsapp";
import { WhatsappRealtimeListener } from "@/components/whatsapp/WhatsappRealtimeListener";

export default async function WhatsappPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; mensaje?: string }>;
}) {
  const { cliente: clienteQuery, mensaje: mensajeQuery } = await searchParams;
  const supabase = await createClient();

  const [conversaciones, { data: { user } }] = await Promise.all([
    getUltimosMensajesPorCliente(supabase),
    supabase.auth.getUser(),
  ]);

  const clienteSeleccionadoId = clienteQuery ?? conversaciones[0]?.clienteId ?? null;

  const [cliente, hilo] = clienteSeleccionadoId
    ? await Promise.all([
        getClienteConEtapa(supabase, clienteSeleccionadoId),
        getMensajesWhatsapp(supabase, clienteSeleccionadoId),
      ])
    : [null, []];

  return (
    <div className="flex flex-1 flex-col overflow-hidden px-4 py-6 md:px-9 md:py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight text-white">WhatsApp</h1>
        <p className="mt-0.5 text-[13px] text-[#444]">
          Tus conversaciones de WhatsApp, en un solo lugar.
        </p>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        <div className="flex w-full max-w-[300px] flex-col overflow-y-auto rounded-[14px] border border-border bg-card">
          {conversaciones.length === 0 && (
            <p className="p-5 text-sm text-[#555]">
              Todavía no tienes conversaciones — en cuanto un cliente te escriba,
              aparece aquí.
            </p>
          )}
          {conversaciones.map((c) => (
            <Link
              key={c.clienteId}
              href={`/whatsapp?cliente=${c.clienteId}`}
              className={`flex flex-col gap-0.5 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-[#161616] ${
                c.clienteId === clienteSeleccionadoId ? "bg-[#1A1A1A]" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-semibold text-[#F0F0F0]">
                  {c.clienteNombre}
                </span>
                <span className="shrink-0 text-[11px] text-[#555]">
                  {formatDistanceToNowStrict(new Date(c.createdAt), { locale: es })}
                </span>
              </div>
              <p className="truncate text-[12px] text-[#777]">
                {c.direccion === "saliente" ? "Tú: " : ""}
                {c.contenido}
              </p>
            </Link>
          ))}
        </div>

        {/* key: fuerza remount al cambiar de conversación — si no, el estado
        local del borrador y del hilo optimista quedaría pegado al cliente
        anterior (mismo bug ya resuelto antes en ClientesView y en
        TarjetaSeccion de /conocimiento). */}
        <PanelConversacionWhatsapp
          key={clienteSeleccionadoId ?? "vacio"}
          cliente={cliente}
          hiloInicial={hilo}
          borradorInicial={mensajeQuery}
        />
      </div>

      {user && <WhatsappRealtimeListener userId={user.id} />}
    </div>
  );
}
