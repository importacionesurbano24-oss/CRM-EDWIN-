"use client";

import { useState } from "react";
import { toast } from "sonner";
import { actionEnviarMensajeChat } from "@/app/actions/chat.actions";
import type { MensajeChat } from "@/lib/types";
import { BurbujaMensaje } from "@/components/chat/BurbujaMensaje";
import { CampoMensajeChat } from "@/components/chat/CampoMensajeChat";

export function ChatNegocio({ historialInicial }: { historialInicial: MensajeChat[] }) {
  const [mensajes, setMensajes] = useState(historialInicial);
  const [pending, setPending] = useState(false);

  async function enviar(mensaje: string) {
    setPending(true);
    setMensajes((prev) => [
      ...prev,
      {
        id: `optimista-${Date.now()}`,
        user_id: "",
        cliente_id: null,
        rol: "user",
        mensaje,
        created_at: new Date().toISOString(),
      },
    ]);

    const result = await actionEnviarMensajeChat(null, mensaje);
    setPending(false);

    if (!result.data) {
      toast.error(result.error);
      return;
    }
    const mensajeAsistente = result.data;
    setMensajes((prev) => [...prev, mensajeAsistente]);
  }

  return (
    <div className="mb-8 rounded-[14px] border border-border bg-card p-5">
      <h2 className="mb-4 text-xs font-semibold tracking-wide text-[#555] uppercase">
        Chat del negocio
      </h2>

      <div className="mb-4 flex h-[380px] flex-col gap-2.5 overflow-y-auto">
        {mensajes.length === 0 && (
          <p className="text-sm text-[#555]">
            Pregúntale al agente sobre tu negocio: cuántos leads tienes,
            quién lleva más tiempo sin responder, cuántas ventas cerraste
            este mes, o pídele un mensaje para publicar en redes.
          </p>
        )}
        {mensajes.map((m) => (
          <BurbujaMensaje key={m.id} mensaje={m} />
        ))}
        {pending && <p className="text-xs text-[#555]">Pensando...</p>}
      </div>

      <CampoMensajeChat
        onEnviar={enviar}
        pending={pending}
        placeholder="Pregúntale algo a tu negocio..."
      />
    </div>
  );
}
