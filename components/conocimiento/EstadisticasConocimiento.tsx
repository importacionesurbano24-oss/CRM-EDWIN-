import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ORDEN_SECCIONES } from "@/lib/ui/conocimiento";
import type { ConocimientoNegocio } from "@/lib/types";

export function EstadisticasConocimiento({ filas }: { filas: ConocimientoNegocio[] }) {
  const completas = filas.filter((f) => f.contenido.trim() !== "").length;
  const conBusqueda = filas.filter((f) => f.embedding != null).length;
  const totalCaracteres = filas.reduce((suma, f) => suma + f.contenido.length, 0);
  const actualizaciones = filas
    .map((f) => f.updated_at)
    .filter(Boolean)
    .sort()
    .reverse();
  const ultimaActualizacion = actualizaciones[0]
    ? format(new Date(actualizaciones[0]), "d MMM yyyy, HH:mm", { locale: es })
    : "—";

  const stats = [
    { valor: `${completas}/${ORDEN_SECCIONES.length}`, label: "Secciones completas" },
    { valor: `${conBusqueda}/${ORDEN_SECCIONES.length}`, label: "Con búsqueda activa" },
    { valor: totalCaracteres.toLocaleString("es-CO"), label: "Caracteres guardados" },
    { valor: ultimaActualizacion, label: "Última actualización" },
  ];

  return (
    <div className="rounded-[14px] border border-border bg-card p-5">
      <h2 className="mb-4 text-xs font-semibold tracking-wide text-[#555] uppercase">
        Estadísticas del conocimiento
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-[#141414] p-3.5">
            <div className="text-lg leading-tight font-bold text-foreground">{s.valor}</div>
            <div className="mt-0.5 text-[11px] text-[#666]">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
