import { createClient } from "@/lib/supabase/server";
import { getClientesConEtapa } from "@/lib/data/clientes";
import { actionCargarPromptActivo } from "@/app/actions/entrenamiento.actions";
import { SYSTEM_PROMPT_BASE } from "@/lib/claude/chat";
import { PaginaEntrenamiento } from "@/components/entrenamiento/PaginaEntrenamiento";

export default async function EntrenamientoPage() {
  const supabase = await createClient();
  // actionCargarPromptActivo (en vez de una función de lib/data) reutiliza
  // la misma Server Action que ya usa el botón "Cargar prompt actual" de
  // EditorPromptPanel, para no duplicar la consulta a agent_config.
  const [clientes, promptActivo] = await Promise.all([
    getClientesConEtapa(supabase),
    actionCargarPromptActivo(),
  ]);

  if (promptActivo.error) {
    console.error("EntrenamientoPage — actionCargarPromptActivo:", promptActivo.error);
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight text-white">
          Entrenamiento
        </h1>
        <p className="mt-0.5 text-[13px] text-[#444]">
          Edita el system prompt del agente y pruébalo en un chat simulado que no se
          guarda.
        </p>
      </div>

      <PaginaEntrenamiento
        promptActivoInicial={promptActivo.data ?? null}
        systemPromptBase={SYSTEM_PROMPT_BASE}
        clientes={clientes.map((c) => ({ id: c.id, nombre: c.nombre }))}
      />
    </div>
  );
}
