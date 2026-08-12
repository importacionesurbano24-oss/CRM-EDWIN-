"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MessageCircle, Sparkles, Send, AlertTriangle } from "lucide-react";
import {
  actionSugerirRespuestaWhatsapp,
  actionEnviarWhatsapp,
  actionMarcarWhatsappEnviado,
} from "@/app/actions/whatsapp.actions";
import { dentroDeVentana24h } from "@/lib/whatsapp/ventana";
import type { MensajeWhatsapp } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BurbujaWhatsapp } from "@/components/whatsapp/BurbujaWhatsapp";

export function HiloWhatsapp({
  clienteId,
  mensajesIniciales,
}: {
  clienteId: string;
  mensajesIniciales: MensajeWhatsapp[];
}) {
  const [mensajes, setMensajes] = useState(mensajesIniciales);
  const [sugerencia, setSugerencia] = useState<string | null>(null);
  const [sugiriendo, setSugiriendo] = useState(false);
  const [enviando, startEnviar] = useTransition();

  const dentroVentana = dentroDeVentana24h(mensajes);

  async function generarSugerencia() {
    setSugiriendo(true);
    const result = await actionSugerirRespuestaWhatsapp(clienteId);
    setSugiriendo(false);
    if (!result.data) {
      toast.error(result.error);
      return;
    }
    setSugerencia(result.data);
  }

  function enviar() {
    if (!sugerencia) return;
    startEnviar(async () => {
      const result = await actionEnviarWhatsapp(clienteId, sugerencia);
      if (!result.data) {
        toast.error(result.error);
        return;
      }
      const mensajeEnviado = result.data;
      setMensajes((prev) => [...prev, mensajeEnviado]);
      setSugerencia(null);
      toast.success("Mensaje enviado.");
    });
  }

  function marcarEnviadoManual() {
    if (!sugerencia) return;
    startEnviar(async () => {
      const result = await actionMarcarWhatsappEnviado(clienteId, sugerencia);
      if (!result.data) {
        toast.error(result.error);
        return;
      }
      const mensajeGuardado = result.data;
      setMensajes((prev) => [...prev, mensajeGuardado]);
      setSugerencia(null);
      toast.success("Marcado como enviado.");
    });
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
          disabled={sugiriendo}
          onClick={generarSugerencia}
          className="gap-1.5"
        >
          <Sparkles className="size-3.5" />
          {sugiriendo ? "Pensando..." : "Sugerir respuesta"}
        </Button>
      </div>

      <div className="mb-4 flex max-h-[300px] flex-col gap-2.5 overflow-y-auto">
        {mensajes.map((m) => (
          <BurbujaWhatsapp key={m.id} mensaje={m} />
        ))}
      </div>

      {sugerencia && (
        <div className="flex flex-col gap-2 rounded-lg bg-[#1A1A1A] p-3.5">
          <div className="text-[11px] tracking-wide text-[#444] uppercase">
            Sugerencia
          </div>
          <p className="text-sm whitespace-pre-wrap text-[#D0D0D0]">{sugerencia}</p>

          {!dentroVentana && (
            <div className="flex items-start gap-2 text-[12px] text-[#AAA]">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[#FF9F43]" />
              <span>
                Pasaron más de 24h desde el último mensaje del cliente — WhatsApp ya no
                permite mensajes libres.
              </span>
            </div>
          )}

          <div className="flex gap-2">
            {dentroVentana ? (
              <Button size="sm" disabled={enviando} onClick={enviar} className="gap-1.5">
                <Send className="size-3.5" />
                {enviando ? "Enviando..." : "Enviar"}
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled={enviando} onClick={marcarEnviadoManual}>
                {enviando ? "Guardando..." : "Marcar como enviado manualmente"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
