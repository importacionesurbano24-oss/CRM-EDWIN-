import type { ReactNode } from "react";

export function TarjetaKpi({
  titulo,
  valor,
  subtitulo,
  cambioPct,
  invertirColor = false,
  children,
}: {
  titulo: string;
  valor: string;
  subtitulo?: string;
  cambioPct?: number | null;
  /** true para métricas donde bajar es la buena noticia (ej. tiempo de cierre). */
  invertirColor?: boolean;
  children?: ReactNode;
}) {
  const esPositivo =
    cambioPct === undefined || cambioPct === null
      ? null
      : invertirColor
        ? cambioPct <= 0
        : cambioPct >= 0;

  return (
    <div className="rounded-[14px] border border-border bg-card p-5">
      <div className="mb-1 text-[11px] tracking-wide text-[#555] uppercase">
        {titulo}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-[32px] leading-none font-extrabold text-white">
          {valor}
        </span>
        {esPositivo !== null && (
          <span
            className={`mb-1 text-[13px] font-semibold ${
              esPositivo ? "text-brand-lime" : "text-destructive"
            }`}
          >
            {cambioPct! >= 0 ? "+" : ""}
            {cambioPct}%
          </span>
        )}
      </div>
      {subtitulo && <p className="mt-1 text-[11px] text-[#555]">{subtitulo}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
