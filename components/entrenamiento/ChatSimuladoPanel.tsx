"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FlaskConical } from "lucide-react";
import {
  actionEnviarMensajeEntrenamiento,
  type TurnoEntrenamiento,
} from "@/app/actions/entrenamiento.actions";
import type { MensajeConversacion } from "@/lib/claude/chat";
import { BurbujaMensaje } from "@/components/chat/BurbujaMensaje";
import { CampoMensajeChat } from "@/components/chat/CampoMensajeChat";
import { Button } from "@/components/ui/button";
import type { ModoModelo } from "./SelectorModoModelo";

export interface MensajeLocal {
  id: string;
  rol: "user" | "assistant";
  mensaje: string;
  mensajeParaCliente: string | null;
}

export function ChatSimuladoPanel({
  systemPrompt,
  modoModelo,
  useRag,
  clienteId,
  mensajes,
  onMensajesChange,
  onTurno,
  onLimpiar,
}: {
  systemPrompt: string;
  modoModelo: ModoModelo;
  useRag: boolean;
  clienteId: string | null;
  mensajes: MensajeLocal[];
  onMensajesChange: (mensajes: MensajeLocal[]) => void;
  onTurno: (turno: TurnoEntrenamiento) => void;
  onLimpiar: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function enviar(mensaje: string) {
    const historialPrevio: MensajeConversacion[] = mensajes.map((m) => ({
      rol: m.rol,
      mensaje: m.mensaje,
    }));

    const mensajesConUsuario: MensajeLocal[] = [
      ...mensajes,
      { id: `local-${Date.now()}`, rol: "user", mensaje, mensajeParaCliente: null },
    ];
    onMensajesChange(mensajesConUsuario);
    setPending(true);

    const result = await actionEnviarMensajeEntrenamiento(
      { clienteId, mensaje, systemPrompt, modoModelo, useRag },
      historialPrevio
    );
    setPending(false);

    if (result.error || !result.data) {
      toast.error(result.error ?? "No se pudo generar la respuesta.");
      return;
    }

    onMensajesChange([
      ...mensajesConUsuario,
      {
        id: `local-${Date.now()}-r`,
        rol: "assistant",
        mensaje: result.data.texto,
        mensajeParaCliente: result.data.mensajeParaCliente,
      },
    ]);
    onTurno(result.data);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[14px] border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-[#FFDD00]/30 bg-[#FFDD00]/10 px-4 py-2.5">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#FFDD00]">
          <FlaskConical className="size-3.5" />
          MODO ENTRENAMIENTO — esta conversación no se guarda
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onLimpiar}
          disabled={mensajes.length === 0 || pending}
        >
          Limpiar conversación
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 md:px-6">
        {mensajes.length === 0 ? (
          <p className="m-auto max-w-xs text-center text-[13px] text-[#666]">
            Escribe un mensaje para empezar a probar el agente.
          </p>
        ) : (
          mensajes.map((m) => (
            <BurbujaMensaje
              key={m.id}
              mensaje={m}
              clienteId={clienteId}
              mensajeParaCliente={m.mensajeParaCliente}
            />
          ))
        )}
        {pending && <p className="text-xs text-[#555]">Pensando...</p>}
      </div>

      <div className="shrink-0 border-t border-border px-4 py-4 md:px-6">
        <CampoMensajeChat
          onEnviar={enviar}
          pending={pending}
          placeholder="Escribe como si fueras el cliente..."
        />
      </div>
    </div>
  );
}
