"use client";

import { PanelChat } from "@/components/chat/PanelChat";

export function ChatAgente({
  clienteId,
  clienteNombre,
}: {
  clienteId: string;
  clienteNombre: string;
}) {
  return (
    <PanelChat
      clienteId={clienteId}
      titulo="Chat con el agente"
      placeholder="Escribe tu pregunta..."
      mensajeVacio={`Pregúntale al agente sobre ${clienteNombre} — qué le escribes, qué cotizó, cuánto lleva sin responder, o pídele un mensaje de cierre.`}
      sugerencias={[
        { label: "¿Qué le cotizamos?", mensaje: "¿Qué le hemos cotizado a este cliente?" },
        { label: "Redactar mensaje de cierre", mensaje: "Redáctame un mensaje para cerrar la venta con este cliente." },
        { label: "¿Por qué no ha respondido?", mensaje: "¿Por qué crees que este cliente no ha respondido?" },
        { label: "Sugerir próxima acción", mensaje: "¿Qué debería hacer ahora con este cliente?" },
      ]}
    />
  );
}
