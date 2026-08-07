import { createClient } from "@/lib/supabase/server";
import { getInfoNegocio } from "@/lib/data/chat";
import { FormularioInfoNegocio } from "@/components/configuracion/FormularioInfoNegocio";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const infoNegocio = await getInfoNegocio(supabase);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight text-white">
          Configuración
        </h1>
        <p className="mt-0.5 text-[13px] text-[#444]">
          Catálogo, garantías y objeciones — el agente de IA lee esto para
          responder preguntas del negocio.
        </p>
      </div>

      <FormularioInfoNegocio contenidoInicial={infoNegocio?.contenido ?? ""} />
    </div>
  );
}
