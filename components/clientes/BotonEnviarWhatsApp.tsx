"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { actionSugerirRespuestaWhatsapp } from "@/app/actions/whatsapp.actions";
import { useNivelIA } from "@/lib/hooks/useNivelIA";
import { DrawerMensajeWhatsApp } from "@/components/clientes/DrawerMensajeWhatsApp";

/**
 * Punto de entrada para arrancar (o retomar) una conversación de WhatsApp
 * desde la ficha del cliente. A diferencia de HiloWhatsapp (que solo
 * aparece si ya hay mensajes previos), este botón siempre está visible —
 * es el único camino para escribirle por primera vez a un cliente nuevo.
 */
export function BotonEnviarWhatsApp({
  clienteId,
  clienteNombre,
  telefono,
}: {
  clienteId: string;
  clienteNombre: string;
  telefono: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [generando, startTransition] = useTransition();
  const [nivel] = useNivelIA();

  function abrir() {
    if (!telefono) {
      toast.error("Este cliente no tiene número de WhatsApp registrado.");
      return;
    }
    setOpen(true);
    setMensaje("");
    startTransition(async () => {
      const result = await actionSugerirRespuestaWhatsapp(clienteId, nivel);
      if (!result.data) {
        toast.error(result.error);
        return;
      }
      setMensaje(result.data);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-[#25D366] transition-colors hover:bg-[#25D366]/10"
      >
        <MessageCircle className="size-3.5" />
        Enviar por WhatsApp
      </button>

      <DrawerMensajeWhatsApp
        open={open}
        onOpenChange={setOpen}
        clienteId={clienteId}
        clienteNombre={clienteNombre}
        telefono={telefono}
        mensaje={mensaje}
        onMensajeChange={setMensaje}
        generando={generando}
      />
    </>
  );
}
