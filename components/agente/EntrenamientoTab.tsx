"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";
import {
  actionEnviarMensajeEntrenamiento,
  actionGuardarPromptActivo,
  actionCargarPromptActivo,
} from "@/app/actions/entrenamiento.actions";
import type { MensajeConversacion } from "@/lib/claude/chat";
import type { AgentConfig } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectorModoModelo, type ModoModelo } from "@/components/entrenamiento/SelectorModoModelo";
import { ToggleRAG } from "@/components/entrenamiento/ToggleRAG";

interface MensajeLocal {
  id: string;
  rol: "user" | "assistant";
  mensaje: string;
}

export function EntrenamientoTab({
  promptActivoInicial,
  systemPromptBase,
  clientes,
}: {
  promptActivoInicial: AgentConfig | null;
  /** SYSTEM_PROMPT_BASE real de producción — punto de partida cuando
   * todavía no hay ningún prompt guardado como activo. */
  systemPromptBase: string;
  clientes: { id: string; nombre: string }[];
}) {
  const [systemPrompt, setSystemPrompt] = useState(
    promptActivoInicial?.system_prompt ?? systemPromptBase
  );
  const [modoModelo, setModoModelo] = useState<ModoModelo>(
    promptActivoInicial?.nivel_ia ?? "basico"
  );
  const [useRag, setUseRag] = useState(promptActivoInicial?.use_rag ?? true);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<MensajeLocal[]>([]);
  const [valor, setValor] = useState("");
  const [pendingChat, setPendingChat] = useState(false);
  const [pendingGuardar, startTransition] = useTransition();

  function guardar() {
    startTransition(async () => {
      // La tabla solo admite 'basico'/'avanzado' — en modo "Automático" se
      // guarda como 'basico' (el modo automático en sí no es persistible,
      // es una elección de esta pantalla, no del prompt guardado).
      const nivelIa = modoModelo === "auto" ? "basico" : modoModelo;
      const nombre = `Prueba ${format(new Date(), "d MMM yyyy, HH:mm", { locale: es })}`;
      const result = await actionGuardarPromptActivo({
        name: nombre,
        systemPrompt,
        nivelIa,
        useRag,
      });
      if (result.data) {
        toast.success(
          modoModelo === "auto"
            ? "Prompt guardado (modo Automático se guarda como Básico)."
            : "Prompt guardado."
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  function cargarActivo() {
    startTransition(async () => {
      const result = await actionCargarPromptActivo();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (!result.data) {
        toast.info("Todavía no hay ningún prompt guardado — mostrando el del código.");
        setSystemPrompt(systemPromptBase);
        return;
      }
      setSystemPrompt(result.data.system_prompt);
      setModoModelo(result.data.nivel_ia);
      setUseRag(result.data.use_rag);
      toast.success("Prompt cargado.");
    });
  }

  function limpiar() {
    setMensajes([]);
  }

  async function enviar(event: FormEvent) {
    event.preventDefault();
    const mensaje = valor.trim();
    if (!mensaje || pendingChat) return;

    const historialPrevio: MensajeConversacion[] = mensajes.map((m) => ({
      rol: m.rol,
      mensaje: m.mensaje,
    }));

    const mensajesConUsuario: MensajeLocal[] = [
      ...mensajes,
      { id: `local-${Date.now()}`, rol: "user", mensaje },
    ];
    setMensajes(mensajesConUsuario);
    setValor("");
    setPendingChat(true);

    const result = await actionEnviarMensajeEntrenamiento(
      { clienteId, mensaje, systemPrompt, modoModelo, useRag },
      historialPrevio
    );
    setPendingChat(false);

    if (result.error || !result.data) {
      toast.error(result.error ?? "No se pudo generar la respuesta.");
      return;
    }

    setMensajes([
      ...mensajesConUsuario,
      { id: `local-${Date.now()}-r`, rol: "assistant", mensaje: result.data.texto },
    ]);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-primary uppercase">
            Comportamiento del agente
          </p>
          <h2 className="mt-1 text-[26px] font-extrabold tracking-tight text-white">
            Prompt del sistema
          </h2>
          <p className="mt-2 text-[13px] text-[#888]">
            Define cómo se comporta, qué puede decir y qué no. Edita aquí y pruébalo
            en el sandbox antes de publicar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SelectorModoModelo value={modoModelo} onChange={setModoModelo} />
          <ToggleRAG value={useRag} onChange={setUseRag} />
          <Select
            value={clienteId ?? "negocio"}
            onValueChange={(value) =>
              setClienteId(value === "negocio" ? null : (value ?? null))
            }
          >
            <SelectTrigger className="h-auto w-auto min-w-[160px] rounded-lg border-border bg-[#141414] py-1.5 text-[11px]">
              <SelectValue placeholder="Negocio general" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negocio">Negocio general</SelectItem>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={16}
            className="min-h-[420px] resize-none border-border bg-[#0A0A0A] font-mono text-[13px] leading-relaxed text-[#DDD]"
          />
          <span className="absolute right-3 bottom-3 text-[11px] text-[#555]">
            {systemPrompt.length.toLocaleString("es-CO")} caracteres
          </span>
        </div>

        <div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={pendingGuardar}
              onClick={cargarActivo}
              className="shrink-0"
            >
              Cargar activo
            </Button>
            <Button
              disabled={pendingGuardar}
              onClick={guardar}
              className="flex-1 justify-center py-3 text-[14px] font-bold"
            >
              Guardar y publicar agente
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-[#555]">
            Se guarda en tu historial de pruebas — el chat real del CRM sigue usando
            el prompt del código hasta que lo actualices ahí.
          </p>
        </div>
      </div>

      <div className="flex h-[640px] flex-col overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-white">Chat de prueba</span>
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary uppercase">
              Sandbox
            </span>
          </div>
          <button
            type="button"
            onClick={limpiar}
            disabled={mensajes.length === 0 || pendingChat}
            className="text-[12px] font-medium text-[#888] transition-colors hover:text-white disabled:opacity-40"
          >
            Limpiar
          </button>
        </div>

        <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-[#FFDD00]/30 bg-[#FFDD00]/10 px-3 py-2 text-[12px] text-[#FFDD00]">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          Ningún mensaje de aquí llega a tus clientes reales — es solo para probar el
          prompt.
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {mensajes.length === 0 ? (
            <p className="m-auto max-w-xs text-center text-[13px] text-[#666]">
              Escribe un mensaje para empezar a probar el agente.
            </p>
          ) : (
            mensajes.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.rol === "user" ? "items-end" : "items-start"}`}
              >
                <span className="mb-1 text-[10px] font-semibold tracking-wide text-[#666] uppercase">
                  {m.rol === "user" ? "Tú (prueba)" : "Agente"}
                </span>
                {m.rol === "user" ? (
                  <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-2.5 text-[14px] whitespace-pre-wrap text-primary-foreground">
                    {m.mensaje}
                  </div>
                ) : (
                  <div className="max-w-[80%] rounded-2xl border border-border bg-[#141414] px-4 py-2.5 text-[14px] whitespace-pre-wrap text-[#E5E5E5]">
                    {m.mensaje}
                  </div>
                )}
              </div>
            ))
          )}
          {pendingChat && <p className="text-xs text-[#555]">Pensando...</p>}
        </div>

        <form
          onSubmit={enviar}
          className="flex items-center gap-2 border-t border-border p-3"
        >
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Escribe como si fueras un cliente..."
            disabled={pendingChat}
            className="flex-1 rounded-full border border-border bg-[#141414] px-4 py-2.5 text-[14px] text-white outline-none placeholder:text-[#555] disabled:opacity-50"
          />
          <Button type="submit" disabled={pendingChat || !valor.trim()}>
            Enviar
          </Button>
        </form>
      </div>
    </div>
  );
}
