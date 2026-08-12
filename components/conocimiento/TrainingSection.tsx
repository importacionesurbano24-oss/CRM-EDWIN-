"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Download, FileUp, Sparkles } from "lucide-react";
import { actionGuardarSeccionConocimiento } from "@/app/actions/conocimiento.actions";
import { SECCION_META, PLANTILLAS_CONOCIMIENTO } from "@/lib/ui/conocimiento";
import type { ConocimientoNegocio, SeccionConocimiento } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const EXTENSIONES_CARGABLES = ".txt,.md";

export function TrainingSection({
  seccion,
  fila,
}: {
  seccion: SeccionConocimiento;
  fila: ConocimientoNegocio | null;
}) {
  const meta = SECCION_META[seccion];
  const Icono = meta.icon;

  const [contenido, setContenido] = useState(fila?.contenido ?? "");
  const [tieneEmbedding, setTieneEmbedding] = useState(fila?.embedding != null);
  const [guardadoEn, setGuardadoEn] = useState(fila?.updated_at ?? null);
  const [mostrarCheck, setMostrarCheck] = useState(false);
  const [pending, startTransition] = useTransition();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [contenido]);

  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, []);

  function guardar() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("seccion", seccion);
      formData.set("contenido", contenido);
      const result = await actionGuardarSeccionConocimiento(formData);

      if (!result.data) {
        toast.error(result.error);
        return;
      }

      setTieneEmbedding(result.data.embeddingGenerado);
      setGuardadoEn(result.data.fila.updated_at);
      setMostrarCheck(true);
      checkTimeoutRef.current = setTimeout(() => setMostrarCheck(false), 2000);

      if (result.data.embeddingGenerado) {
        toast.success("Información guardada.");
      } else {
        toast.warning(
          "Se guardó el texto, pero la búsqueda semántica no está activa (falta configurar VOYAGE_API_KEY)."
        );
      }
    });
  }

  function descargar() {
    const fecha = format(new Date(), "yyyy-MM-dd");
    const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `${seccion}_${fecha}.txt`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  function cargarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = () => setContenido(String(lector.result ?? ""));
    lector.onerror = () => toast.error("No se pudo leer el archivo.");
    lector.readAsText(archivo);
    e.target.value = "";
  }

  function usarPlantilla() {
    if (contenido.trim() !== "") {
      const confirmar = window.confirm(
        "Ya hay contenido en esta sección. ¿Reemplazarlo con la plantilla?"
      );
      if (!confirmar) return;
    }
    setContenido(PLANTILLAS_CONOCIMIENTO[seccion]);
  }

  const configurado = contenido.trim() !== "";

  return (
    <div className="rounded-[14px] border border-border bg-card p-6">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icono className="size-4 text-[#888]" />
          <Label htmlFor={seccion}>{meta.label}</Label>
        </div>
        <Badge variant={configurado ? "default" : "outline"}>
          {configurado ? "Configurado" : "Pendiente"}
        </Badge>
      </div>
      <p className="mb-4 text-[13px] text-[#666]">{meta.descripcion}</p>

      <Textarea
        ref={textareaRef}
        id={seccion}
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        rows={4}
        placeholder={meta.placeholder}
        className="mb-1.5 resize-none overflow-hidden"
      />
      <div className="mb-4 flex items-center justify-between text-[11px] text-[#555]">
        <span>{contenido.length.toLocaleString("es-CO")} caracteres</span>
        <span className={configurado && !tieneEmbedding ? "text-amber-500" : ""}>
          {guardadoEn
            ? `Guardado ${formatDistanceToNow(new Date(guardadoEn), {
                addSuffix: true,
                locale: es,
              })}${configurado && !tieneEmbedding ? " · sin búsqueda semántica" : ""}`
            : "Sin guardar todavía"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={guardar} disabled={pending} className="gap-1.5">
          {pending && "Guardando..."}
          {!pending && mostrarCheck && (
            <>
              <Check className="size-3.5" />
              Guardado
            </>
          )}
          {!pending && !mostrarCheck && "Guardar"}
        </Button>

        <Button variant="outline" size="sm" onClick={descargar} className="gap-1.5">
          <Download className="size-3.5" />
          Descargar .txt
        </Button>

        {seccion !== "catalogo" && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={EXTENSIONES_CARGABLES}
              onChange={cargarArchivo}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5"
            >
              <FileUp className="size-3.5" />
              Cargar archivo
            </Button>
          </>
        )}

        <Button variant="ghost" size="sm" onClick={usarPlantilla} className="gap-1.5">
          <Sparkles className="size-3.5" />
          Usar plantilla
        </Button>
      </div>
    </div>
  );
}
