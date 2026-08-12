"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { MensajeChat } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PanelChat } from "@/components/chat/PanelChat";

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
