"use client";

import type { MensajeChat } from "@/lib/types";
import { PanelChat } from "@/components/chat/PanelChat";

export function ChatNegocio({
  historialInicial,
  preguntaInicial,
}: {
  historialInicial: MensajeChat[];
  /** Pregunta a enviar automáticamente al montar (ej. viene de ?pregunta= desde /inicio). */
  preguntaInicial?: string;
}) {
  return (
    <div className="mb-8">
      <PanelChat
        clienteId={null}
        titulo="Chat del negocio"
        placeholder="Pregúntale algo a tu negocio..."
        mensajeVacio="Pregúntale al agente sobre tu negocio: cuántos leads tienes, quién lleva más tiempo sin responder, cuántas ventas cerraste este mes, o pídele un mensaje para publicar en redes."
        historialInicial={historialInicial}
        mensajeInicial={preguntaInicial}
      />
    </div>
  );
}
