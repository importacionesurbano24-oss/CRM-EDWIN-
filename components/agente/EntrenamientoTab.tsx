"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Globe, Mic, Square, X } from "lucide-react";
import {
  actionEnviarMensajeEntrenamiento,
  actionGuardarPromptActivo,
  actionCargarPromptActivo,
  actionLeerUrlEntrenamiento,
  actionTranscribirAudioEntrenamiento,
} from "@/app/actions/entrenamiento.actions";
import type { MensajeConversacion } from "@/lib/claude/chat";
import type { AgentConfig } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectorModoModelo, type ModoModelo } from "@/components/entrenamiento/SelectorModoModelo";
import { ToggleRAG } from "@/components/entrenamiento/ToggleRAG";
import { esAccionDesactualizada, recargarPorAccionVieja } from "@/lib/utils/accion-servidor";
import {
  AGENTE_ORO as ORO,
  AGENTE_LIMA as LIMA,
  AGENTE_BORDE as BORDE,
  AGENTE_BORDE_2 as BORDE_2,
  AGENTE_TEXTO as TEXTO,
  AGENTE_TEXTO_MUTED as TEXTO_MUTED,
  AGENTE_TEXTO_SUB as TEXTO_SUB,
} from "@/lib/ui/agente-theme";

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
  const [guardado, setGuardado] = useState(false);
  const [pendingGuardar, startTransition] = useTransition();
  const [urlInput, setUrlInput] = useState("");
  const [urlCargada, setUrlCargada] = useState<{ url: string; contenido: string } | null>(
    null
  );
  const [pendingUrl, setPendingUrl] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [pendingTranscripcion, setPendingTranscripcion] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksAudioRef = useRef<Blob[]>([]);

  async function alternarGrabacion() {
    if (grabando) {
      mediaRecorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Este navegador no puede grabar audio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksAudioRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksAudioRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksAudioRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        transcribirGrabacion(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setGrabando(true);
    } catch {
      toast.error("No se pudo acceder al micrófono — revisá los permisos del navegador.");
    }
  }

  async function transcribirGrabacion(blob: Blob) {
    setGrabando(false);
    setPendingTranscripcion(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "grabacion.webm");
      const result = await actionTranscribirAudioEntrenamiento(formData);
      setPendingTranscripcion(false);

      if (result.error || !result.data) {
        toast.error(result.error ?? "No se pudo transcribir el audio.");
        return;
      }
      const textoTranscrito = result.data.texto;
      setValor((prev) => (prev.trim() ? `${prev} ${textoTranscrito}` : `🎤 ${textoTranscrito}`));
    } catch (error) {
      if (esAccionDesactualizada(error)) {
        toast.info("Se actualizó la app — recargando...");
        recargarPorAccionVieja();
        return;
      }
      setPendingTranscripcion(false);
      toast.error("No se pudo transcribir el audio.");
    }
  }

  async function cargarUrl() {
    const url = urlInput.trim();
    if (!url || pendingUrl) return;
    setPendingUrl(true);
    try {
      const result = await actionLeerUrlEntrenamiento(url);
      setPendingUrl(false);

      if (result.error || !result.data) {
        toast.error(result.error ?? "No se pudo leer la URL.");
        return;
      }
      if (result.data.contenido.startsWith("[")) {
        // leerContenidoUrl devuelve un mensaje entre corchetes cuando no
        // pudo leer la página (link roto, no es HTML, etc.) — se muestra
        // igual como aviso en vez de cargarlo como si fuera contenido real.
        toast.warning(result.data.contenido);
        return;
      }
      setUrlCargada(result.data);
      toast.success("Página cargada — el agente ya puede usarla como referencia.");
    } catch (error) {
      if (esAccionDesactualizada(error)) {
        toast.info("Se actualizó la app — recargando...");
        recargarPorAccionVieja();
        return;
      }
      setPendingUrl(false);
      toast.error("No se pudo leer la URL.");
    }
  }

  function quitarUrl() {
    setUrlCargada(null);
    setUrlInput("");
  }

  function guardar() {
    setGuardado(false);
    startTransition(async () => {
      try {
        // La tabla solo admite 'basico'/'avanzado' — en modo "Automático"
        // se guarda como 'basico' (el modo automático en sí no es
        // persistible, es una elección de esta pantalla, no del prompt
        // guardado).
        const nivelIa = modoModelo === "auto" ? "basico" : modoModelo;
        const nombre = `Prueba ${format(new Date(), "d MMM yyyy, HH:mm", { locale: es })}`;
        const result = await actionGuardarPromptActivo({
          name: nombre,
          systemPrompt,
          nivelIa,
          useRag,
        });
        if (result.data) {
          setGuardado(true);
          setTimeout(() => setGuardado(false), 5000);
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        if (esAccionDesactualizada(error)) {
          toast.info("Se actualizó la app — recargando...");
          recargarPorAccionVieja();
          return;
        }
        toast.error("No se pudo guardar el prompt.");
      }
    });
  }

  function cargarActivo() {
    startTransition(async () => {
      try {
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
      } catch (error) {
        if (esAccionDesactualizada(error)) {
          toast.info("Se actualizó la app — recargando...");
          recargarPorAccionVieja();
          return;
        }
        toast.error("No se pudo cargar el prompt.");
      }
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

    try {
      const result = await actionEnviarMensajeEntrenamiento(
        {
          clienteId,
          mensaje,
          systemPrompt,
          modoModelo,
          useRag,
          urlReferencia: urlCargada?.url ?? null,
          contenidoUrlReferencia: urlCargada?.contenido ?? null,
        },
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
    } catch (error) {
      if (esAccionDesactualizada(error)) {
        toast.info("Se actualizó la app — recargando...");
        recargarPorAccionVieja();
        return;
      }
      setPendingChat(false);
      toast.error("No se pudo generar la respuesta.");
    }
  }

  return (
    <div className="mt-2 grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      {/* IZQUIERDA — editor de prompt */}
      <div
        className="flex flex-col gap-4 rounded-2xl p-7"
        style={{ background: "#141414", border: `1px solid ${BORDE_2}` }}
      >
        <div>
          <p
            className="mb-1.5 text-[10.5px] font-bold tracking-[0.08em] uppercase"
            style={{ color: ORO }}
          >
            Comportamiento del agente
          </p>
          <h2
            className="text-[20px] font-bold tracking-[-0.025em]"
            style={{ color: TEXTO }}
          >
            Prompt del sistema
          </h2>
          <p className="mt-2 text-[13px] leading-[1.6]" style={{ color: TEXTO_MUTED }}>
            Define cómo se comporta, qué puede decir y qué no. Edita aquí y prueba en
            el sandbox antes de publicar.
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

        <div>
          {urlCargada ? (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px]"
              style={{
                background: "rgba(170,223,0,0.07)",
                border: "1px solid rgba(170,223,0,0.2)",
                color: LIMA,
              }}
            >
              <Globe className="size-3 shrink-0" />
              <span className="flex-1 truncate">{urlCargada.url}</span>
              <button
                type="button"
                onClick={quitarUrl}
                title="Quitar esta página de referencia"
                className="shrink-0 opacity-70 hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    cargarUrl();
                  }
                }}
                placeholder="URL de referencia (opcional) — ej. la ficha de un producto"
                disabled={pendingUrl}
                className="h-auto min-w-0 flex-1 rounded-lg px-3 py-1.5 text-[11px] outline-none disabled:opacity-50"
                style={{ background: "#141414", border: `1px solid ${BORDE}`, color: TEXTO }}
              />
              <button
                type="button"
                onClick={cargarUrl}
                disabled={pendingUrl || !urlInput.trim()}
                className="shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold disabled:opacity-40"
                style={{ background: "#1C1C1C", border: `1px solid ${BORDE}`, color: TEXTO_MUTED }}
              >
                {pendingUrl ? "Leyendo..." : "Cargar página"}
              </button>
            </div>
          )}
        </div>

        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="h-[360px] w-full resize-none rounded-[10px] outline-none"
          style={{
            background: "#080808",
            color: "#C8E07A",
            borderLeft: `3px solid ${ORO}`,
            padding: "18px 20px",
            fontSize: "12.5px",
            lineHeight: "1.85",
            fontFamily: "var(--font-agente-mono)",
            letterSpacing: "0.01em",
          }}
        />

        <div className="flex justify-end">
          <span
            className="text-[11px] font-medium"
            style={{ color: TEXTO_SUB, fontFamily: "var(--font-agente-mono)" }}
          >
            {systemPrompt.length.toLocaleString("es-CO")} caracteres
          </span>
        </div>

        <div style={{ borderTop: `1px solid ${BORDE}`, margin: "4px 0" }} />

        <button
          type="button"
          onClick={guardar}
          disabled={pendingGuardar}
          className="w-full rounded-[10px] py-3.5 text-[14px] font-bold tracking-[-0.01em] transition-colors disabled:cursor-wait"
          style={{
            background: guardado ? LIMA : pendingGuardar ? "rgba(242,191,46,0.55)" : ORO,
            color: "#0B0B0B",
          }}
        >
          {pendingGuardar
            ? "Guardando..."
            : guardado
              ? "✓ Prompt guardado"
              : "Guardar y publicar agente"}
        </button>
        <p className="text-center text-[11.5px] leading-[1.5]" style={{ color: TEXTO_SUB }}>
          Se guarda como referencia — el chat real del CRM sigue usando el prompt del
          código hasta que lo actualices ahí.{" "}
          <button
            type="button"
            onClick={cargarActivo}
            disabled={pendingGuardar}
            className="underline decoration-dotted underline-offset-2 disabled:cursor-wait"
          >
            Cargar el último guardado
          </button>
        </p>
      </div>

      {/* DERECHA — chat de prueba (sandbox) */}
      <div
        className="flex flex-col overflow-hidden rounded-2xl"
        style={{ background: "#141414", border: `1px solid ${BORDE_2}` }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${BORDE}`, background: "#0E0E0E" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-[14px] font-bold" style={{ color: TEXTO }}>
              Chat de prueba
            </span>
            <span
              className="rounded-md px-2.5 py-[3px] text-[10.5px] font-bold tracking-[0.06em] uppercase"
              style={{
                background: "rgba(242,191,46,0.1)",
                color: ORO,
                border: "1px solid rgba(242,191,46,0.28)",
              }}
            >
              Sandbox
            </span>
          </div>
          <button
            type="button"
            onClick={limpiar}
            disabled={mensajes.length === 0 || pendingChat}
            className="text-[11.5px] font-semibold disabled:opacity-40"
            style={{ color: TEXTO_MUTED }}
          >
            Limpiar
          </button>
        </div>

        <div
          className="flex items-center gap-2 px-5 py-2.5 text-[12px] font-medium"
          style={{
            background: "rgba(170,223,0,0.05)",
            borderBottom: `1px solid ${BORDE}`,
            color: "rgba(170,223,0,0.75)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
            <circle cx="7" cy="7" r="6.5" stroke={LIMA} strokeOpacity="0.7" />
            <path d="M7 4v3.5M7 9.5v.5" stroke={LIMA} strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Ningún mensaje de aquí llega a tus clientes reales — es solo para probar el
          prompt
        </div>

        <div
          className="flex-1 overflow-y-auto px-5 pt-5 pb-2"
          style={{ minHeight: "340px", maxHeight: "380px" }}
        >
          {mensajes.length === 0 && !pendingChat ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.18">
                <rect x="4" y="6" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 34l4-4h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="14" cy="18" r="1.5" fill="currentColor" />
                <circle cx="20" cy="18" r="1.5" fill="currentColor" />
                <circle cx="26" cy="18" r="1.5" fill="currentColor" />
              </svg>
              <p
                className="max-w-[220px] text-center text-[13px] leading-[1.6]"
                style={{ color: TEXTO_SUB }}
              >
                Escribe algo para probar cómo respondería tu agente con el prompt
                actual
              </p>
            </div>
          ) : (
            mensajes.map((m) => (
              <div
                key={m.id}
                className="mb-3.5 flex animate-[fade-up_0.22s_ease]"
                style={{ justifyContent: m.rol === "user" ? "flex-end" : "flex-start" }}
              >
                <div
                  className="flex max-w-[84%] flex-col"
                  style={{ alignItems: m.rol === "user" ? "flex-end" : "flex-start" }}
                >
                  <span
                    className="mb-1 text-[10px] font-bold tracking-[0.07em] uppercase"
                    style={{ color: m.rol === "user" ? TEXTO_MUTED : LIMA }}
                  >
                    {m.rol === "user" ? "Tú (prueba)" : "Agente"}
                  </span>
                  <div
                    className="px-3.5 py-2.5 text-[13.5px] leading-[1.55] whitespace-pre-wrap"
                    style={
                      m.rol === "user"
                        ? { background: ORO, color: "#0B0B0B", borderRadius: "14px 14px 4px 14px" }
                        : {
                            background: "#1D1D1D",
                            color: TEXTO,
                            borderRadius: "14px 14px 14px 4px",
                            border: `1px solid ${BORDE}`,
                          }
                    }
                  >
                    {m.mensaje}
                  </div>
                </div>
              </div>
            ))
          )}
          {pendingChat && (
            <div className="mb-3.5 flex justify-start">
              <div className="flex flex-col items-start">
                <span
                  className="mb-1 text-[10px] font-bold tracking-[0.07em] uppercase"
                  style={{ color: LIMA }}
                >
                  Agente
                </span>
                <div
                  className="flex items-center gap-1.5 px-4 py-3"
                  style={{
                    background: "#1D1D1D",
                    borderRadius: "14px 14px 14px 4px",
                    border: `1px solid ${BORDE}`,
                  }}
                >
                  {[0, 0.18, 0.36].map((delay) => (
                    <span
                      key={delay}
                      className="size-[6px] animate-[typing-dot_1.1s_ease-in-out_infinite] rounded-full"
                      style={{ background: LIMA, animationDelay: `${delay}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={enviar}
          className="flex items-end gap-2.5 px-4.5 py-3.5"
          style={{ borderTop: `1px solid ${BORDE}` }}
        >
          <textarea
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar(e);
              }
            }}
            placeholder={
              pendingTranscripcion
                ? "Transcribiendo audio..."
                : "Escribe como si fueras un cliente..."
            }
            disabled={pendingChat || grabando || pendingTranscripcion}
            rows={2}
            className="flex-1 resize-none rounded-[10px] outline-none disabled:opacity-50"
            style={{
              background: "#191919",
              color: TEXTO,
              border: `1px solid ${BORDE}`,
              padding: "10px 14px",
              fontSize: "13.5px",
              lineHeight: "1.5",
            }}
          />
          <button
            type="button"
            onClick={alternarGrabacion}
            disabled={pendingChat || pendingTranscripcion}
            title={grabando ? "Detener grabación" : "Grabar una nota de voz"}
            className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] transition-colors disabled:opacity-40"
            style={
              grabando
                ? { background: "#E5484D", color: "#fff" }
                : { background: "#1C1C1C", border: `1px solid ${BORDE}`, color: TEXTO_MUTED }
            }
          >
            {grabando ? (
              <Square className="size-3.5 fill-current" />
            ) : (
              <Mic className="size-4" />
            )}
          </button>
          <button
            type="submit"
            disabled={pendingChat || grabando || pendingTranscripcion || !valor.trim()}
            className="shrink-0 rounded-[10px] px-4.5 py-2.5 text-[13px] font-bold disabled:opacity-40"
            style={{ background: ORO, color: "#0B0B0B" }}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
