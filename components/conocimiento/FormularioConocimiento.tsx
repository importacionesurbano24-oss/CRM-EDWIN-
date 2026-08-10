"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { actionGuardarSeccionConocimiento } from "@/app/actions/conocimiento.actions";
import { SECCION_META, ORDEN_SECCIONES } from "@/lib/ui/conocimiento";
import type { ConocimientoNegocio, SeccionConocimiento } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CargaMasivaCatalogo } from "@/components/conocimiento/CargaMasivaCatalogo";

export function FormularioConocimiento({
  filas,
}: {
  filas: ConocimientoNegocio[];
}) {
  const porSeccion = new Map(filas.map((f) => [f.seccion, f]));

  return (
    <div className="flex flex-col gap-4">
      {ORDEN_SECCIONES.map((seccion) => {
        const fila = porSeccion.get(seccion) ?? null;
        return (
          <div key={seccion} className="flex flex-col gap-4">
            {/* key con updated_at: sin esto, después de guardar por carga
            masiva la tarjeta no se entera del contenido nuevo — su estado
            local solo se inicializa una vez, al montar. */}
            <TarjetaSeccion key={fila?.updated_at ?? seccion} seccion={seccion} fila={fila} />
            {seccion === "catalogo" && <CargaMasivaCatalogo />}
          </div>
        );
      })}
    </div>
  );
}

function TarjetaSeccion({
  seccion,
  fila,
}: {
  seccion: SeccionConocimiento;
  fila: ConocimientoNegocio | null;
}) {
  const meta = SECCION_META[seccion];
  const [contenido, setContenido] = useState(fila?.contenido ?? "");
  const [tieneEmbedding, setTieneEmbedding] = useState(fila?.embedding != null);
  const [pending, startTransition] = useTransition();

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
      if (result.data.embeddingGenerado) {
        toast.success("Información guardada.");
      } else {
        toast.warning(
          "Se guardó el texto, pero la búsqueda semántica no está activa (falta configurar VOYAGE_API_KEY)."
        );
      }
    });
  }

  const Icono = meta.icon;

  return (
    <div className="rounded-[14px] border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icono className="size-4 text-[#888]" />
          <Label htmlFor={seccion}>{meta.label}</Label>
        </div>
        {contenido.trim() !== "" && (
          <Badge variant={tieneEmbedding ? "default" : "outline"}>
            {tieneEmbedding ? "IA activa" : "Sin búsqueda semántica"}
          </Badge>
        )}
      </div>
      <Textarea
        id={seccion}
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        rows={6}
        placeholder={meta.placeholder}
        className="mb-4"
      />
      <Button onClick={guardar} disabled={pending}>
        {pending ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  );
}
