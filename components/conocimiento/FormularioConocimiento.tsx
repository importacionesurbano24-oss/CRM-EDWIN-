"use client";

import { ORDEN_SECCIONES } from "@/lib/ui/conocimiento";
import type { ConocimientoNegocio } from "@/lib/types";
import { TrainingSection } from "@/components/conocimiento/TrainingSection";
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
            <TrainingSection key={fila?.updated_at ?? seccion} seccion={seccion} fila={fila} />
            {seccion === "catalogo" && <CargaMasivaCatalogo />}
          </div>
        );
      })}
    </div>
  );
}
