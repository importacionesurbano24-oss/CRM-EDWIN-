"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { MensajeChat } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PanelChat } from "@/components/chat/PanelChat";

/**
 * Monta/desmonta PanelChat en vez de solo ocultarlo — decisión consciente:
 * al cerrar y volver a abrir en la misma sesión de página, el panel arranca
 * de nuevo desde `historialInicial` (el estado del último load), así que
 * mensajes mandados en una apertura anterior no se ven hasta recargar la
 * página. Ya quedan guardados en `chat_agente` (no se pierde nada en la
 * base de datos) — es solo la vista en memoria de este panel de prueba, no
 * la conversación real con clientes. No vale la pena controlar el estado
 * de PanelChat desde afuera solo para este caso de uso.
 */
export function AgentTestModal({ historialInicial }: { historialInicial: MensajeChat[] }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setAbierto(true)} className="gap-1.5">
        <Sparkles className="size-3.5" />
        Probar agente
      </Button>
      {abierto && (
        <PanelChat
          clienteId={null}
          titulo="Probar agente"
          placeholder="Pregúntale algo a tu negocio..."
          mensajeVacio="Pregúntale al agente sobre tu negocio: cuántos leads tienes, quién lleva más tiempo sin responder, cuántas ventas cerraste este mes, o pídele un mensaje para publicar en redes."
          historialInicial={historialInicial}
          expandidoInicial
          onCerrar={() => setAbierto(false)}
        />
      )}
    </>
  );
}
