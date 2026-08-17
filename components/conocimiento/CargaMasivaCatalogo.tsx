"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { UploadCloud, X, FileText } from "lucide-react";
import {
  actionAnalizarCargaMasiva,
  type AnalisisCargaMasivaResult,
} from "@/app/actions/carga-masiva.actions";
import { actionGuardarSeccionConocimiento } from "@/app/actions/conocimiento.actions";
import { useNivelIA } from "@/lib/hooks/useNivelIA";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SelectorNivelIA } from "@/components/shared/SelectorNivelIA";

function formatearTamano(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CargaMasivaCatalogo() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [instruccion, setInstruccion] = useState("");
  const [propuesta, setPropuesta] = useState<AnalisisCargaMasivaResult | null>(null);
  const [catalogoEditado, setCatalogoEditado] = useState("");
  const [analizando, startAnalisis] = useTransition();
  const [guardando, startGuardado] = useTransition();
  const [nivel, setNivel] = useNivelIA();

  function soltarArchivo(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setArrastrando(false);
    const soltado = e.dataTransfer.files?.[0];
    if (soltado) setArchivo(soltado);
  }

  function analizar() {
    if (!archivo) {
      toast.error("Selecciona un archivo.");
      return;
    }
    startAnalisis(async () => {
      const formData = new FormData();
      formData.set("archivo", archivo);
      formData.set("instruccion", instruccion);
      formData.set("nivel", nivel);
      const result = await actionAnalizarCargaMasiva(formData);

      if (!result.data) {
        toast.error(result.error);
        return;
      }
      setPropuesta(result.data);
      setCatalogoEditado(result.data.catalogoPropuesto);
    });
  }

  function cancelar() {
    setPropuesta(null);
    setCatalogoEditado("");
  }

  function confirmar() {
    startGuardado(async () => {
      const formData = new FormData();
      formData.set("seccion", "catalogo");
      formData.set("contenido", catalogoEditado);
      const result = await actionGuardarSeccionConocimiento(formData);

      if (!result.data) {
        toast.error(result.error);
        return;
      }

      toast.success("Catálogo actualizado.");
      setArchivo(null);
      setInstruccion("");
      setPropuesta(null);
      setCatalogoEditado("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  return (
    <div className="rounded-[14px] border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <UploadCloud className="size-4 text-[#888]" />
        <Label>Actualizar catálogo con un archivo</Label>
      </div>
      <p className="mb-4 text-[13px] text-[#666]">
        Sube una lista de precios (PDF, Excel, foto, o texto) y dile a la IA
        qué hacer con ella. Vas a poder revisar los cambios antes de guardar.
      </p>

      {!propuesta ? (
        <div className="flex flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.xlsx,.txt,.csv,image/jpeg,image/png,image/webp"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            className="hidden"
          />

          {archivo ? (
            <div className="flex items-center justify-between rounded-xl border border-border bg-[#141414] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <FileText className="size-4 shrink-0 text-[#888]" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] text-[#F0F0F0]">{archivo.name}</p>
                  <p className="text-[11px] text-[#666]">{formatearTamano(archivo.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setArchivo(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-[#888] transition-colors hover:bg-[#222] hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={soltarArchivo}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors ${
                arrastrando
                  ? "border-primary bg-primary/5"
                  : "border-[#2A2A2A] bg-[#111] hover:border-[#3A3A3A]"
              }`}
            >
              <UploadCloud className="size-6 text-[#666]" />
              <p className="text-[13px] text-[#D0D0D0]">
                Arrastra y suelta tu archivo aquí
              </p>
              <p className="text-[12px] text-[#666]">o haz clic para seleccionar</p>
              <p className="text-[11px] text-[#444]">
                PDF, Excel, imagen o texto — máx. 4MB
              </p>
            </div>
          )}

          <Textarea
            value={instruccion}
            onChange={(e) => setInstruccion(e.target.value)}
            rows={2}
            placeholder='Ej: "agrega estos productos nuevos" o "actualiza los precios con este archivo"'
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={analizar} disabled={analizando} className="w-fit">
              {analizando ? "Analizando..." : "Analizar archivo"}
            </Button>
            <SelectorNivelIA value={nivel} onChange={setNivel} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{propuesta.productosNuevos} nuevos</Badge>
            <Badge variant="outline">{propuesta.productosActualizados} actualizados</Badge>
          </div>
          <p className="text-[13px] text-[#D0D0D0]">{propuesta.resumen}</p>
          <Textarea
            value={catalogoEditado}
            onChange={(e) => setCatalogoEditado(e.target.value)}
            rows={10}
          />
          <div className="flex gap-2">
            <Button onClick={confirmar} disabled={guardando}>
              {guardando ? "Guardando..." : "Confirmar y guardar"}
            </Button>
            <Button variant="ghost" onClick={cancelar} disabled={guardando}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
