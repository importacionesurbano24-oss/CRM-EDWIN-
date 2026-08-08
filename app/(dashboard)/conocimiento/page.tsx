import { createClient } from "@/lib/supabase/server";
import { getConocimientoNegocio } from "@/lib/data/conocimiento";
import { getInfoNegocio } from "@/lib/data/chat";
import { FormularioConocimiento } from "@/components/conocimiento/FormularioConocimiento";

export default async function ConocimientoPage() {
  const supabase = await createClient();
  const [filas, infoNegocioAntigua] = await Promise.all([
    getConocimientoNegocio(supabase),
    getInfoNegocio(supabase),
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
          Conocimiento del negocio
        </h1>
        <p className="mt-0.5 text-[13px] text-[#444]">
          Catálogo, garantías, objeciones y más — el agente de IA busca aquí
          antes de responder preguntas del negocio.
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

      <FormularioConocimiento filas={filas} />
    </div>
  );
}
