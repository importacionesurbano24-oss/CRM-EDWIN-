import { Syne, IBM_Plex_Mono } from "next/font/google";
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
import { AGENTE_TEXTO, AGENTE_TEXTO_MUTED } from "@/lib/ui/agente-theme";

// Tipografía del handoff de Claude Design ("Agente IA.dc.html"), aplicada
// solo dentro de esta página — el resto del CRM sigue con Outfit
// (app/layout.tsx). Syne para texto normal, IBM Plex Mono para el
// textarea del prompt (ver EntrenamientoTab).
const syne = Syne({
  variable: "--font-agente-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-agente-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

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
    <div
      className={`${syne.variable} ${ibmPlexMono.variable} flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8`}
      style={{ fontFamily: "var(--font-agente-sans)" }}
    >
      <div className="flex items-start justify-between gap-5">
        <div>
          <h1
            className="text-[36px] font-extrabold tracking-[-0.035em]"
            style={{ color: AGENTE_TEXTO, lineHeight: 1.1, margin: "0 0 6px" }}
          >
            Agente IA
          </h1>
          <p className="text-[14px] leading-[1.5]" style={{ color: AGENTE_TEXTO_MUTED }}>
            Entrena y configura el asistente que atiende tus prospectos en WhatsApp
          </p>
        </div>
        <div
          className="mt-1 flex shrink-0 items-center gap-2 rounded-[10px] px-4 py-2"
          style={{
            background: "rgba(170,223,0,0.07)",
            border: "1px solid rgba(170,223,0,0.2)",
            animation: "pulse-glow 2.8s ease infinite",
          }}
        >
          <span className="size-2 shrink-0 rounded-full" style={{ background: "#AADF00" }} />
          <span
            className="text-[12px] font-bold tracking-[0.06em] uppercase"
            style={{ color: "#AADF00" }}
          >
            Activo
          </span>
        </div>
      </div>

      <AgenteTabs
        conocimiento={
          <div className="mt-7">
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
          </div>
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
