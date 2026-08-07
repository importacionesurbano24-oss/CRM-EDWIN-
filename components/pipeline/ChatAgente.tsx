"use client";

import type { MensajeChat } from "@/lib/types";
import { PanelChat } from "@/components/chat/PanelChat";

export function ChatAgente({
  clienteId,
  clienteNombre,
  historialInicial,
}: {
  clienteId: string;
  clienteNombre: string;
  historialInicial: MensajeChat[];
}) {
  return (
    <PanelChat
      clienteId={clienteId}
      titulo="Chat con el agente"
      placeholder="Escribe tu pregunta..."
      mensajeVacio={`Pregúntale al agente sobre ${clienteNombre} — qué le escribes, qué cotizó, cuánto lleva sin responder, o pídele un mensaje de cierre.`}
      historialInicial={historialInicial}
      accionExtra={{
        label: "Sugerir próxima acción",
        mensaje: "¿Qué debería hacer ahora con este cliente?",
      }}
      alCerrarIrA="/dashboard"
    />
  );
}
