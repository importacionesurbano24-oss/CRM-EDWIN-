import { createClient } from "@/lib/supabase/server";
import { getConocimientoNegocio } from "@/lib/data/conocimiento";
import { getInfoNegocio } from "@/lib/data/chat";
import { getClientesConEtapa } from "@/lib/data/clientes";
import { actionCargarPromptActivo } from "@/app/actions/entrenamiento.actions";
import { SYSTEM_PROMPT_BASE } from "@/lib/claude/chat";
import { FormularioConocimiento } from "@/components/conocimiento/FormularioConocimiento";
import { EstadisticasConocimiento } from "@/components/conocimiento/EstadisticasConocimiento";
import { ChatNegocio } from "@/components/dashboard/ChatNegocio";
import { AgenteTabs } from "@/components/agente/AgenteTabs";
import { EntrenamientoTab } from "@/components/agente/EntrenamientoTab";

export default async function AgentePage() {
  const supabase = await createClient();
  // actionCargarPromptActivo (en vez de una función de lib/data) reutiliza
  // la misma Server Action que ya usa el botón "Cargar activo" de la
  // pestaña Entrenamiento, para no duplicar la consulta a agent_config.
  const [filas, infoNegocioAntigua, clientes, promptActivo] = await Promise.all([
    getConocimientoNegocio(supabase),
    getInfoNegocio(supabase),
    getClientesConEtapa(supabase),
    actionCargarPromptActivo(),
  ]);

  if (promptActivo.error) {
    console.error("AgentePage — actionCargarPromptActivo:", promptActivo.error);
  }

  const hayContenidoNuevo = filas.some((f) => f.contenido.trim() !== "");
  const contenidoAntiguo =
    !hayContenidoNuevo && infoNegocioAntigua?.contenido.trim()
      ? infoNegocioAntigua.contenido
      : null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-extrabold tracking-tight text-white">
            Agente IA
          </h1>
          <p className="mt-1 text-[13px] text-[#666]">
            Entrena y configura el asistente que atiende tus prospectos en WhatsApp.
          </p>
        </div>
        <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-lime/40 bg-brand-lime/10 px-3 py-1 text-[11px] font-semibold text-brand-lime">
          <span className="size-1.5 rounded-full bg-brand-lime" />
          ACTIVO
        </span>
      </div>

      <AgenteTabs
        conocimiento={
          <>
            {contenidoAntiguo && (
              <div className="mb-6 max-w-2xl rounded-[14px] border border-[#FFDD00]/30 bg-[#FFDD00]/5 p-5">
                <p className="mb-2 text-[13px] font-semibold text-[#FFDD00]">
                  Tenías esto guardado en la Configuración anterior
                </p>
                <p className="mb-3 text-[13px] whitespace-pre-wrap text-[#AAA]">
                  {contenidoAntiguo}
                </p>
                <p className="text-[12px] text-[#666]">
                  Cópialo a la sección que corresponda abajo. Este aviso desaparece
                  en cuanto guardes cualquier sección.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
              <FormularioConocimiento filas={filas} />

              <div className="flex flex-col gap-6">
                <ChatNegocio />
                <EstadisticasConocimiento filas={filas} />
              </div>
            </div>
          </>
        }
        entrenamiento={
          <EntrenamientoTab
            promptActivoInicial={promptActivo.data ?? null}
            systemPromptBase={SYSTEM_PROMPT_BASE}
            clientes={clientes.map((c) => ({ id: c.id, nombre: c.nombre }))}
          />
        }
      />
    </div>
  );
}
