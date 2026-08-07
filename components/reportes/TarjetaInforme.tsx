import type { ReactNode } from "react";

export function TarjetaInforme({
  titulo,
  subtitulo,
  className = "",
  children,
}: {
  titulo: string;
  subtitulo?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-[14px] border border-border bg-card p-5 ${className}`}>
      <div className="mb-1 text-sm font-semibold text-[#F0F0F0]">{titulo}</div>
      <div className="mb-4 text-[11px] text-[#555]">{subtitulo ?? " "}</div>
      {children}
    </div>
  );
}
