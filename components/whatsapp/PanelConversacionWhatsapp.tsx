"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Send, AlertTriangle } from "lucide-react";
import {
  actionSugerirRespuestaWhatsapp,
  actionEnviarWhatsapp,
  actionMarcarWhatsappEnviado,
} from "@/app/actions/whatsapp.actions";
import { dentroDeVentana24h } from "@/lib/whatsapp/ventana";
import type { ClienteConEtapa, MensajeWhatsapp } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BurbujaWhatsapp } from "@/components/whatsapp/BurbujaWhatsapp";

export function PanelConversacionWhatsapp({
  cliente,
  hiloInicial,
  borradorInicial,
}: {
  cliente: ClienteConEtapa | null;
  hiloInicial: MensajeWhatsapp[];
  /** Mensaje que trae el link "Ir a WhatsApp →" desde la ficha del cliente. */
  borradorInicial?: string;
}) {
  const router = useRouter();
  const [mensajes, setMensajes] = useState(hiloInicial);
  const [borrador, setBorrador] = useState(borradorInicial ?? "");
  const [vieneDelAgente, setVieneDelAgente] = useState(Boolean(borradorInicial));
  const [sugiriendo, startSugerir] = useTransition();
  const [enviando, startEnviar] = useTransition();
  const finRef = useRef<HTMLDivElement>(null);

  const dentroVentana = dentroDeVentana24h(mensajes);

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: "end" });
  }, [mensajes]);

  // Limpia ?mensaje= de la URL una vez que ya sembró el borrador — así un
  // refresh de la página no lo vuelve a rellenar.
  useEffect(() => {
    if (borradorInicial && cliente) {
      router.replace(`/whatsapp?cliente=${cliente.id}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sugerir() {
    if (!cliente) return;
    startSugerir(async () => {
      const result = await actionSugerirRespuestaWhatsapp(cliente.id);
      if (!result.data) {
        toast.error(result.error);
        return;
      }
      setBorrador(result.data);
      setVieneDelAgente(true);
    });
  }

  function enviar() {
    if (!cliente || !borrador.trim()) return;
    startEnviar(async () => {
      const result = await actionEnviarWhatsapp(cliente.id, borrador);
      if (!result.data) {
        toast.error(result.error);
        return;
      }
      const mensajeEnviado = result.data;
      setMensajes((prev) => [...prev, mensajeEnviado]);
      setBorrador("");
      setVieneDelAgente(false);
      toast.success("Mensaje enviado.");
    });
  }

  function marcarEnviadoManual() {
    if (!cliente || !borrador.trim()) return;
    startEnviar(async () => {
      const result = await actionMarcarWhatsappEnviado(cliente.id, borrador);
      if (!result.data) {
        toast.error(result.error);
        return;
      }
      const mensajeGuardado = result.data;
      setMensajes((prev) => [...prev, mensajeGuardado]);
      setBorrador("");
      setVieneDelAgente(false);
      toast.success("Marcado como enviado.");
    });
  }

  if (!cliente) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-[14px] border border-border bg-card p-6 text-sm text-[#666]">
        Selecciona una conversación para verla acá.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col rounded-[14px] border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <Link
            href={`/clientes/${cliente.id}`}
            className="text-sm font-semibold text-[#F0F0F0] hover:text-primary"
          >
            {cliente.nombre}
          </Link>
          <p className="text-[12px] text-[#666]">{cliente.telefono_whatsapp}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-5 py-4">
        {mensajes.length === 0 && (
          <p className="text-sm text-[#555]">Todavía no hay mensajes con este cliente.</p>
        )}
        {mensajes.map((m) => (
          <BurbujaWhatsapp key={m.id} mensaje={m} />
        ))}
        <div ref={finRef} />
      </div>

      <div className="border-t border-border p-4">
        {!dentroVentana && (
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-[#1A1A1A] p-3 text-[12px] text-[#AAA]">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[#FF9F43]" />
            <span>
              Pasaron más de 24h desde el último mensaje del cliente — WhatsApp ya no
              permite mensajes libres. Si le escribiste por otro medio, márcalo como
              enviado; si no, espera a que él escriba primero.
            </span>
          </div>
        )}
        <Textarea
          value={borrador}
          onChange={(e) => {
            setBorrador(e.target.value);
            if (!e.target.value.trim()) setVieneDelAgente(false);
          }}
          rows={3}
          placeholder="Escribe tu respuesta..."
          className={`mb-3 ${vieneDelAgente ? "border-primary/60" : ""}`}
        />
        {vieneDelAgente && (
          <p className="mb-3 text-[11px] text-primary/80">
            Este mensaje lo generó el agente — revísalo antes de enviar.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={sugiriendo}
            onClick={sugerir}
            className="gap-1.5"
          >
            <Sparkles className="size-3.5" />
            {sugiriendo ? "Pensando..." : "Sugerir respuesta"}
          </Button>
          {dentroVentana ? (
            <Button size="sm" disabled={enviando || !borrador.trim()} onClick={enviar} className="gap-1.5">
              <Send className="size-3.5" />
              {enviando ? "Enviando..." : "Enviar"}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              disabled={enviando || !borrador.trim()}
              onClick={marcarEnviadoManual}
            >
              {enviando ? "Guardando..." : "Marcar como enviado manualmente"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
