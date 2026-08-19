"use client";

import { useState } from "react";
import type { TurnoEntrenamiento } from "@/app/actions/entrenamiento.actions";
import type { AgentConfig } from "@/lib/types";
import { EditorPromptPanel } from "./EditorPromptPanel";
import { ChatSimuladoPanel, type MensajeLocal } from "./ChatSimuladoPanel";
import { PanelDebug } from "./PanelDebug";
import type { ModoModelo } from "./SelectorModoModelo";

export function PaginaEntrenamiento({
  promptActivoInicial,
  clientes,
}: {
  promptActivoInicial: AgentConfig | null;
  clientes: { id: string; nombre: string }[];
}) {
  const [systemPrompt, setSystemPrompt] = useState(
    promptActivoInicial?.system_prompt ?? ""
  );
  const [modoModelo, setModoModelo] = useState<ModoModelo>(
    promptActivoInicial?.nivel_ia ?? "basico"
  );
  const [useRag, setUseRag] = useState(promptActivoInicial?.use_rag ?? true);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<MensajeLocal[]>([]);
  const [debugLog, setDebugLog] = useState<TurnoEntrenamiento[]>([]);

  function limpiar() {
    setMensajes([]);
    setDebugLog([]);
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr_320px]">
      <div className="h-[600px]">
        <EditorPromptPanel
          systemPrompt={systemPrompt}
          onChangeSystemPrompt={setSystemPrompt}
          modoModelo={modoModelo}
          onChangeModoModelo={setModoModelo}
          useRag={useRag}
          onChangeUseRag={setUseRag}
          clienteId={clienteId}
          onChangeClienteId={setClienteId}
          clientes={clientes}
        />
      </div>

      <div className="h-[600px]">
        <ChatSimuladoPanel
          systemPrompt={systemPrompt}
          modoModelo={modoModelo}
          useRag={useRag}
          clienteId={clienteId}
          mensajes={mensajes}
          onMensajesChange={setMensajes}
          onTurno={(turno) => setDebugLog((prev) => [...prev, turno])}
          onLimpiar={limpiar}
        />
      </div>

      <div className="h-[600px]">
        <PanelDebug log={debugLog} />
      </div>
    </div>
  );
}
