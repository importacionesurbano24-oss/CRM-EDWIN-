"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import {
  actionAnalizarCargaMasiva,
  type AnalisisCargaMasivaResult,
} from "@/app/actions/carga-masiva.actions";
import { actionGuardarSeccionConocimiento } from "@/app/actions/conocimiento.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function CargaMasivaCatalogo() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [instruccion, setInstruccion] = useState("");
  const [propuesta, setPropuesta] = useState<AnalisisCargaMasivaResult | null>(null);
  const [catalogoEditado, setCatalogoEditado] = useState("");
  const [analizando, startAnalisis] = useTransition();
  const [guardando, startGuardado] = useTransition();

  function analizar() {
    if (!archivo) {
      toast.error("Selecciona un archivo.");
      return;
    }
    startAnalisis(async () => {
      const formData = new FormData();
      formData.set("archivo", archivo);
      formData.set("instruccion", instruccion);
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
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.xlsx,.txt,.csv,image/jpeg,image/png,image/webp"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
          <Textarea
            value={instruccion}
            onChange={(e) => setInstruccion(e.target.value)}
            rows={2}
            placeholder='Ej: "agrega estos productos nuevos" o "actualiza los precios con este archivo"'
          />
          <Button onClick={analizar} disabled={analizando} className="w-fit">
            {analizando ? "Analizando..." : "Analizar archivo"}
          </Button>
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
