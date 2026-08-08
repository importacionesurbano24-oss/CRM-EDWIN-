"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Sparkles } from "lucide-react";
import {
  actionSugerirRespuestaWhatsapp,
  actionMarcarWhatsappEnviado,
} from "@/app/actions/whatsapp.actions";
import type { MensajeWhatsapp } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function HiloWhatsapp({
  clienteId,
  mensajesIniciales,
}: {
  clienteId: string;
  mensajesIniciales: MensajeWhatsapp[];
}) {
  const [mensajes, setMensajes] = useState(mensajesIniciales);
  const [sugerencia, setSugerencia] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function generarSugerencia() {
    setPending(true);
    const result = await actionSugerirRespuestaWhatsapp(clienteId);
    setPending(false);
    if (!result.data) {
      toast.error(result.error);
      return;
    }
    setSugerencia(result.data);
  }

  function copiar() {
    if (!sugerencia) return;
    navigator.clipboard
      .writeText(sugerencia)
      .then(() => toast.success("Mensaje copiado."))
      .catch(() => toast.error("No se pudo copiar."));
  }

  async function marcarEnviado() {
    if (!sugerencia) return;
    const result = await actionMarcarWhatsappEnviado(clienteId, sugerencia);
    if (!result.data) {
      toast.error(result.error);
      return;
    }
    const mensajeGuardado = result.data;
    setMensajes((prev) => [...prev, mensajeGuardado]);
    setSugerencia(null);
    toast.success("Marcado como enviado.");
  }

  // Sin actividad de WhatsApp todavía — no ocupar espacio en la ficha.
  if (mensajes.length === 0 && !sugerencia) return null;

  return (
    <div className="rounded-[14px] border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[#555] uppercase">
          <MessageCircle className="size-3.5" />
          WhatsApp
        </h2>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={generarSugerencia}
          className="gap-1.5"
        >
          <Sparkles className="size-3.5" />
          {pending ? "Pensando..." : "Sugerir respuesta"}
        </Button>
      </div>

      <div className="mb-4 flex max-h-[300px] flex-col gap-2.5 overflow-y-auto">
        {mensajes.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.direccion === "saliente" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                m.direccion === "saliente"
                  ? "bg-primary/15 text-[#F0F0F0]"
                  : "bg-[#1A1A1A] text-[#E5E5E5]"
              }`}
            >
              {m.contenido}
            </div>
          </div>
        ))}
      </div>

      {sugerencia && (
        <div className="flex flex-col gap-2 rounded-lg bg-[#1A1A1A] p-3.5">
          <div className="text-[11px] tracking-wide text-[#444] uppercase">
            Sugerencia
          </div>
          <p className="text-sm whitespace-pre-wrap text-[#D0D0D0]">{sugerencia}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={copiar}>
              Copiar mensaje
            </Button>
            <Button size="sm" variant="outline" onClick={marcarEnviado}>
              Marcar como enviado
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
