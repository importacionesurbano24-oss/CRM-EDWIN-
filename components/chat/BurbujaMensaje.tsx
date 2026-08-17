"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, MessageCircle } from "lucide-react";
import type { MensajeChat } from "@/lib/types";

const MS_POR_CARACTER = 12; // ritmo base del "tipeo"
const DURACION_MAXIMA_MS = 2200; // tope para que un mensaje largo no tarde una eternidad

export function BurbujaMensaje({
  mensaje,
  animar = false,
  clienteId = null,
}: {
  mensaje: Pick<MensajeChat, "id" | "rol" | "mensaje">;
  /** Si es true, el texto se revela como si el agente lo estuviera escribiendo. */
  animar?: boolean;
  /** Si viene (chat de un cliente puntual, no el de negocio), se ofrece enviar este mensaje por WhatsApp. */
  clienteId?: string | null;
}) {
  const esUsuario = mensaje.rol === "user";
  const texto = mensaje.mensaje;
  const [visibles, setVisibles] = useState(0);

  useEffect(() => {
    if (!animar) return; // sin animación: se muestra el texto completo directo, más abajo

    // `visibles` ya arranca en 0 (useState(0)) — cada mensaje nuevo monta un
    // componente fresco (key={m.id} en PanelChat), así que no hace falta
    // resetearlo acá.
    const duracion = Math.min(texto.length * MS_POR_CARACTER, DURACION_MAXIMA_MS);
    const inicio = performance.now();
    let frame: number;

    function tick(ahora: number) {
      const progreso = Math.min((ahora - inicio) / duracion, 1);
      setVisibles(Math.round(progreso * texto.length));
      if (progreso < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animar, texto]);

  if (esUsuario) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-3xl bg-[#2A2A2A] px-4 py-2.5 text-[15px] whitespace-pre-wrap text-[#F0F0F0]">
          {texto}
        </div>
      </div>
    );
  }

  const textoVisible = animar ? texto.slice(0, visibles) : texto;
  const escribiendo = animar && visibles < texto.length;

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <Sparkles className="size-3.5 text-primary" />
      </div>
      <div className="max-w-[85%] pt-1">
        <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-[#E5E5E5]">
          {textoVisible}
          {escribiendo && (
            <span className="ml-0.5 inline-block h-[15px] w-[2px] translate-y-[2px] animate-pulse bg-primary" />
          )}
        </div>
        {clienteId && !escribiendo && (
          <Link
            href={`/whatsapp?cliente=${clienteId}&mensaje=${encodeURIComponent(texto)}`}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#25D366] bg-[#25D366]/10 px-3 py-1.5 text-[12px] font-semibold text-[#25D366] transition-colors hover:bg-[#25D366]/20"
          >
            <MessageCircle className="size-3.5" />
            Enviar por WhatsApp
          </Link>
        )}
      </div>
    </div>
  );
}
