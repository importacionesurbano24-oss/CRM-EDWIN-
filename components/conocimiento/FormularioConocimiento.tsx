"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Globe } from "lucide-react";
import {
  actionGuardarSeccionConocimiento,
  actionLeerUrlConocimiento,
} from "@/app/actions/conocimiento.actions";
import { SECCION_META, ORDEN_SECCIONES } from "@/lib/ui/conocimiento";
import type { ConocimientoNegocio, SeccionConocimiento } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CargaMasivaCatalogo } from "@/components/conocimiento/CargaMasivaCatalogo";
import { esAccionDesactualizada, recargarPorAccionVieja } from "@/lib/utils/accion-servidor";

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
  const [urlSitio, setUrlSitio] = useState("");
  const [pendingUrl, setPendingUrl] = useState(false);

  async function cargarSitio() {
    const url = urlSitio.trim();
    if (!url || pendingUrl) return;
    setPendingUrl(true);
    try {
      const result = await actionLeerUrlConocimiento(url);
      setPendingUrl(false);

      if (result.error || !result.data) {
        toast.error(result.error ?? "No se pudo leer la página.");
        return;
      }
      if (result.data.contenido.startsWith("[")) {
        // leerContenidoUrl devuelve un mensaje entre corchetes cuando no
        // pudo leer la página (link roto, no es HTML, etc.).
        toast.warning(result.data.contenido);
        return;
      }

      const contenidoLeido = result.data.contenido;
      setContenido((prev) =>
        prev.trim()
          ? `${prev}\n\n[Contenido de ${url}]\n${contenidoLeido}`
          : `[Contenido de ${url}]\n${contenidoLeido}`
      );
      setUrlSitio("");
      toast.success("Página agregada abajo — revisala y dale Guardar para que quede.");
    } catch (error) {
      if (esAccionDesactualizada(error)) {
        toast.info("Se actualizó la app — recargando...");
        recargarPorAccionVieja();
        return;
      }
      setPendingUrl(false);
      toast.error("No se pudo leer la página.");
    }
  }

  function guardar() {
    startTransition(async () => {
      try {
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
      } catch (error) {
        if (esAccionDesactualizada(error)) {
          toast.info("Se actualizó la app — recargando...");
          recargarPorAccionVieja();
          return;
        }
        toast.error("No se pudo guardar.");
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
      {seccion === "datos_empresa" && (
        <div className="mb-4 flex items-center gap-2">
          <Input
            value={urlSitio}
            onChange={(e) => setUrlSitio(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                cargarSitio();
              }
            }}
            placeholder="Sitio web del negocio (ej. https://dormiluna.com)"
            disabled={pendingUrl}
          />
          <Button
            type="button"
            variant="outline"
            onClick={cargarSitio}
            disabled={pendingUrl || !urlSitio.trim()}
            className="shrink-0 gap-1.5"
          >
            <Globe className="size-3.5" />
            {pendingUrl ? "Leyendo..." : "Cargar sitio"}
          </Button>
        </div>
      )}
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
