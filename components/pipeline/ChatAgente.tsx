"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { actionEnviarMensajeChat } from "@/app/actions/chat.actions";
import type { MensajeChat } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BurbujaMensaje } from "@/components/chat/BurbujaMensaje";
import { CampoMensajeChat } from "@/components/chat/CampoMensajeChat";

export function ChatAgente({
  clienteId,
  clienteNombre,
  historialInicial,
}: {
  clienteId: string;
  clienteNombre: string;
  historialInicial: MensajeChat[];
}) {
  const [mensajes, setMensajes] = useState(historialInicial);
  const [pending, setPending] = useState(false);

  async function enviar(mensaje: string) {
    setPending(true);
    setMensajes((prev) => [
      ...prev,
      {
        id: `optimista-${Date.now()}`,
        user_id: "",
        cliente_id: clienteId,
        rol: "user",
        mensaje,
        created_at: new Date().toISOString(),
      },
    ]);

    const result = await actionEnviarMensajeChat(clienteId, mensaje);
    setPending(false);

    if (!result.data) {
      toast.error(result.error);
      return;
    }
    const mensajeAsistente = result.data;
    setMensajes((prev) => [...prev, mensajeAsistente]);
  }

  return (
    <div className="rounded-[14px] border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide text-[#555] uppercase">
          Chat con el agente
        </h2>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => enviar("¿Qué debería hacer ahora con este cliente?")}
          className="gap-1.5"
        >
          <Sparkles className="size-3.5" />
          Sugerir próxima acción
        </Button>
      </div>

      <div className="mb-4 flex max-h-[360px] flex-col gap-2.5 overflow-y-auto">
        {mensajes.length === 0 && (
          <p className="text-sm text-[#555]">
            Pregúntale al agente sobre {clienteNombre} — qué le escribes, qué
            cotizó, cuánto lleva sin responder, o pídele un mensaje de cierre.
          </p>
        )}
        {mensajes.map((m) => (
          <BurbujaMensaje key={m.id} mensaje={m} />
        ))}
        {pending && <p className="text-xs text-[#555]">Pensando...</p>}
      </div>

      <CampoMensajeChat onEnviar={enviar} pending={pending} />
    </div>
  );
}
