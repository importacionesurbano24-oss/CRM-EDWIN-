import { createClient } from "@/lib/supabase/server";
import { getConocimientoNegocio } from "@/lib/data/conocimiento";
import { getInfoNegocio, getHistorialChat } from "@/lib/data/chat";
import { ORDEN_SECCIONES } from "@/lib/ui/conocimiento";
import { FormularioConocimiento } from "@/components/conocimiento/FormularioConocimiento";
import { EstadisticasConocimiento } from "@/components/conocimiento/EstadisticasConocimiento";
import { AgentTestModal } from "@/components/conocimiento/AgentTestModal";

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

  const completas = filas.filter((f) => f.contenido.trim() !== "").length;
  const total = ORDEN_SECCIONES.length;
  const porcentaje = total === 0 ? 0 : Math.round((completas / total) * 100);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-white">
            Entrenamiento del agente
          </h1>
          <p className="mt-0.5 text-[13px] text-[#444]">
            Edita lo que tu agente sabe del negocio y pruébalo con el botón de la derecha.
          </p>
        </div>
        <AgentTestModal historialInicial={historialChat} />
      </div>

      <div className="mb-6 max-w-md">
        <div className="mb-1.5 flex items-center justify-between text-[12px] text-[#888]">
          <span>
            {completas} de {total} secciones configuradas
          </span>
          <span>{porcentaje}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1A1A1A]">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <FormularioConocimiento filas={filas} />

        <div className="flex flex-col gap-6">
          <EstadisticasConocimiento filas={filas} />
        </div>
      </div>
    </div>
  );
}
