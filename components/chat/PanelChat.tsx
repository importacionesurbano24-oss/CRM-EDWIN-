"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { X, Bot } from "lucide-react";
import { actionEnviarMensajeChat } from "@/app/actions/chat.actions";
import type { MensajeChat } from "@/lib/types";
import { useNivelIA } from "@/lib/hooks/useNivelIA";
import { BurbujaMensaje } from "@/components/chat/BurbujaMensaje";
import { CampoMensajeChat } from "@/components/chat/CampoMensajeChat";
import { SelectorNivelIA } from "@/components/shared/SelectorNivelIA";

const SALUDO = "¿En qué puedo ayudar, Dormiluna?";

/**
 * UI y estado compartidos por los dos chats (ficha de cliente y negocio).
 * Empieza como tarjeta chica embebida; se expande a pantalla completa
 * estilo ChatGPT recién cuando se envía el primer mensaje (no al enfocar
 * el campo). Si `alCerrarIrA` viene definido, cerrar el chat expandido
 * navega ahí en vez de solo volver a la tarjeta chica.
 */
export function PanelChat({
  clienteId,
  titulo,
  placeholder,
  mensajeVacio,
  historialInicial,
  sugerencias,
  alCerrarIrA,
  mensajeInicial,
}: {
  clienteId: string | null;
  titulo: string;
  placeholder: string;
  mensajeVacio: string;
  historialInicial: MensajeChat[];
  sugerencias?: { label: string; mensaje: string }[];
  alCerrarIrA?: string;
  /** Si viene (ej. desde ?pregunta= en la URL), se envía solo una vez al montar. */
  mensajeInicial?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mensajes, setMensajes] = useState(historialInicial);
  const [pending, setPending] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const [nivel, setNivel] = useNivelIA();
  const yaEnvioInicial = useRef(false);

  useEffect(() => {
    if (!mensajeInicial || yaEnvioInicial.current) return;
    yaEnvioInicial.current = true;
    enviar(mensajeInicial);
    router.replace(pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensajeInicial]);

  function cerrar() {
    setExpandido(false);
    if (alCerrarIrA) router.push(alCerrarIrA);
  }

  async function enviar(mensaje: string) {
    setExpandido(true);
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

    const result = await actionEnviarMensajeChat(clienteId, mensaje, nivel);
    setPending(false);

    // El mensaje del usuario ya se guardó y se muestra optimista arriba —
    // si falló la respuesta del agente, result.data puede venir con ese
    // mismo mensaje de usuario (no null) junto con result.error. Chequear
    // el error primero evita duplicar el mensaje del usuario como si
    // fuera la respuesta del agente.
    if (result.error) {
      toast.error(result.error);
      return;
    }
    const mensajeAsistente = result.data;
    if (mensajeAsistente) {
      setMensajes((prev) => [...prev, mensajeAsistente]);
    }
  }

  const vacio = mensajes.length === 0;

  const encabezado = (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand-lime">
        <Bot className="size-4 text-background" />
      </div>
      <div>
        <div className="text-[13px] font-semibold text-[#F0F0F0]">{titulo}</div>
        <div className="flex items-center gap-1.5">
          <span className="size-[6px] animate-pulse rounded-full bg-brand-lime" />
          <span className="text-[11px] text-brand-lime">En línea</span>
        </div>
      </div>
    </div>
  );

  const chipsSugerencias = sugerencias && sugerencias.length > 0 && (
    <div className="flex flex-wrap gap-1.5">
      {sugerencias.map((s) => (
        <button
          key={s.label}
          type="button"
          disabled={pending}
          onClick={() => enviar(s.mensaje)}
          className="rounded-full border border-border bg-[#1A1A1A] px-3 py-1.5 text-[11.5px] font-medium text-[#ccc] transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {s.label}
        </button>
      ))}
    </div>
  );

  const listaMensajes = (
    <>
      {mensajes.map((m) => (
        <BurbujaMensaje key={m.id} mensaje={m} />
      ))}
      {pending && <p className="text-xs text-[#555]">Pensando...</p>}
    </>
  );

  const saludoVacio = (tamano: "sm" | "lg") => (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-center ${
        tamano === "lg" ? "flex-1 px-4 py-10" : "py-8"
      }`}
    >
      <div>
        <p
          className={
            tamano === "lg"
              ? "text-2xl font-semibold text-[#F0F0F0]"
              : "text-base font-semibold text-[#F0F0F0]"
          }
        >
          {SALUDO}
        </p>
        <p className={tamano === "lg" ? "mt-2 max-w-md text-sm text-[#666]" : "mt-1 max-w-xs text-[13px] text-[#666]"}>
          {mensajeVacio}
        </p>
      </div>
      {chipsSugerencias}
    </div>
  );

  if (expandido) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 md:px-6">
          {encabezado}
          <div className="flex items-center gap-2">
            <SelectorNivelIA value={nivel} onChange={setNivel} />
            <button
              type="button"
              onClick={cerrar}
              className="flex size-8 items-center justify-center rounded-full text-[#888] transition-colors hover:bg-[#1A1A1A] hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 md:px-6">
          {vacio ? (
            saludoVacio("lg")
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">{listaMensajes}</div>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-4 py-4 md:px-6">
          <div className="mx-auto max-w-3xl">
            <CampoMensajeChat onEnviar={enviar} pending={pending} placeholder={placeholder} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        {encabezado}
        <SelectorNivelIA value={nivel} onChange={setNivel} />
      </div>

      <div className="p-5">
        {vacio ? (
          saludoVacio("sm")
        ) : (
          <div className="mb-4 flex max-h-[360px] flex-col gap-3 overflow-y-auto">
            {listaMensajes}
          </div>
        )}

        {!vacio && chipsSugerencias && <div className="mb-4">{chipsSugerencias}</div>}

        <CampoMensajeChat onEnviar={enviar} pending={pending} placeholder={placeholder} />
      </div>
    </div>
  );
}
