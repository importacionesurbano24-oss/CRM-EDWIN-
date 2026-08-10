import { createClient } from "@/lib/supabase/server";
import { getConocimientoNegocio } from "@/lib/data/conocimiento";
import { getInfoNegocio, getHistorialChat } from "@/lib/data/chat";
import { FormularioConocimiento } from "@/components/conocimiento/FormularioConocimiento";
import { EstadisticasConocimiento } from "@/components/conocimiento/EstadisticasConocimiento";
import { ChatNegocio } from "@/components/dashboard/ChatNegocio";

export default async function ConocimientoPage() {
  const supabase = await createClient();
  const [filas, infoNegocioAntigua, historialChat] = await Promise.all([
    getConocimientoNegocio(supabase),
    getInfoNegocio(supabase),
    getHistorialChat(supabase, null),
  ]);

  const hayContenidoNuevo = filas.some((f) => f.contenido.trim() !== "");
  const contenidoAntiguo =
    !hayContenidoNuevo && infoNegocioAntigua?.contenido.trim()
      ? infoNegocioAntigua.contenido
      : null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight text-white">
          Entrenamiento del agente
        </h1>
        <p className="mt-0.5 text-[13px] text-[#444]">
          Edita lo que tu agente sabe del negocio y pruébalo en vivo, a la derecha.
        </p>
      </div>

      {contenidoAntiguo && (
        <div className="mb-6 max-w-2xl rounded-[14px] border border-[#FFDD00]/30 bg-[#FFDD00]/5 p-5">
          <p className="mb-2 text-[13px] font-semibold text-[#FFDD00]">
            Tenías esto guardado en la Configuración anterior
          </p>
          <p className="mb-3 whitespace-pre-wrap text-[13px] text-[#AAA]">
            {contenidoAntiguo}
          </p>
          <p className="text-[12px] text-[#666]">
            Cópialo a la sección que corresponda abajo. Este aviso
            desaparece en cuanto guardes cualquier sección.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <FormularioConocimiento filas={filas} />

        <div className="flex flex-col gap-6">
          <ChatNegocio historialInicial={historialChat} />
          <EstadisticasConocimiento filas={filas} />
        </div>
      </div>
    </div>
  );
}
