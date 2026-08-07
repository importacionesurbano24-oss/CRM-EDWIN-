"use client";

import type { MensajeChat } from "@/lib/types";
import { PanelChat } from "@/components/chat/PanelChat";

export function ChatNegocio({ historialInicial }: { historialInicial: MensajeChat[] }) {
  return (
    <div className="mb-8">
      <PanelChat
        clienteId={null}
        titulo="Chat del negocio"
        placeholder="Pregúntale algo a tu negocio..."
        mensajeVacio="Pregúntale al agente sobre tu negocio: cuántos leads tienes, quién lleva más tiempo sin responder, cuántas ventas cerraste este mes, o pídele un mensaje para publicar en redes."
        historialInicial={historialInicial}
      />
    </div>
  );
}
