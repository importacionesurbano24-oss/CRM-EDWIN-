"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Sparkles } from "lucide-react";
import { actionEnviarMensajeChat } from "@/app/actions/chat.actions";
import type { MensajeChat } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BurbujaMensaje } from "@/components/chat/BurbujaMensaje";
import { CampoMensajeChat } from "@/components/chat/CampoMensajeChat";

const SALUDO = "¿En qué puedo ayudar, Dormiluna?";

/**
 * UI y estado compartidos por los chats de la app. Por defecto empieza
 * como tarjeta chica embebida; se expande a pantalla completa estilo
 * ChatGPT recién cuando se envía el primer mensaje (no al enfocar el
 * campo) — salvo que se monte con `expandidoInicial`, para usarlo directo
 * como modal (ver AgentTestModal). Si `alCerrarIrA` viene definido, cerrar
 * el chat expandido navega ahí en vez de solo volver a la tarjeta chica;
 * `onCerrar` avisa a quien lo montó (por ejemplo, para desmontarlo).
 */
export function PanelChat({
  clienteId,
  titulo,
  placeholder,
  mensajeVacio,
  historialInicial,
  accionExtra,
  alCerrarIrA,
  expandidoInicial = false,
  onCerrar,
}: {
  clienteId: string | null;
  titulo: string;
  placeholder: string;
  mensajeVacio: string;
  historialInicial: MensajeChat[];
  accionExtra?: { label: string; mensaje: string };
  alCerrarIrA?: string;
  /** Monta el panel directo en modo pantalla completa, sin esperar el primer mensaje. */
  expandidoInicial?: boolean;
  /** Se llama al cerrar — para que quien lo montó en un modal pueda desmontarlo. */
  onCerrar?: () => void;
}) {
  const router = useRouter();
  const [mensajes, setMensajes] = useState(historialInicial);
  const [pending, setPending] = useState(false);
  const [expandido, setExpandido] = useState(expandidoInicial);

  function cerrar() {
    setExpandido(false);
    if (alCerrarIrA) router.push(alCerrarIrA);
    onCerrar?.();
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

    const result = await actionEnviarMensajeChat(clienteId, mensaje);
    setPending(false);

    if (!result.data) {
      toast.error(result.error);
      return;
    }
    const mensajeAsistente = result.data;
    setMensajes((prev) => [...prev, mensajeAsistente]);
  }

  const vacio = mensajes.length === 0;

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
      className={`flex flex-col items-center justify-center gap-2 text-center ${
        tamano === "lg" ? "flex-1 px-4 py-10" : "py-8"
      }`}
    >
      <p
        className={
          tamano === "lg"
            ? "text-2xl font-semibold text-[#F0F0F0]"
            : "text-base font-semibold text-[#F0F0F0]"
        }
      >
        {SALUDO}
      </p>
      <p className={tamano === "lg" ? "max-w-md text-sm text-[#666]" : "max-w-xs text-[13px] text-[#666]"}>
        {mensajeVacio}
      </p>
    </div>
  );

  if (expandido) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 md:px-6">
          <h2 className="text-sm font-semibold text-[#F0F0F0]">{titulo}</h2>
          <button
            type="button"
            onClick={cerrar}
            className="flex size-8 items-center justify-center rounded-full text-[#888] transition-colors hover:bg-[#1A1A1A] hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 md:px-6">
          {vacio ? (
            saludoVacio("lg")
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">{listaMensajes}</div>
          )}
        </div>

        <div className="shrink-0 border-t border-border px-4 py-4 md:px-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {accionExtra && vacio && (
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => enviar(accionExtra.mensaje)}
                className="w-fit gap-1.5"
              >
                <Sparkles className="size-3.5" />
                {accionExtra.label}
              </Button>
            )}
            <CampoMensajeChat onEnviar={enviar} pending={pending} placeholder={placeholder} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide text-[#555] uppercase">
          {titulo}
        </h2>
        {accionExtra && (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => enviar(accionExtra.mensaje)}
            className="gap-1.5"
          >
            <Sparkles className="size-3.5" />
            {accionExtra.label}
          </Button>
        )}
      </div>

      {vacio ? (
        saludoVacio("sm")
      ) : (
        <div className="mb-4 flex max-h-[360px] flex-col gap-3 overflow-y-auto">
          {listaMensajes}
        </div>
      )}

      <CampoMensajeChat onEnviar={enviar} pending={pending} placeholder={placeholder} />
    </div>
  );
}
