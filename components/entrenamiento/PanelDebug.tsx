"use client";

import { Download, Clock, Cpu, Coins, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TurnoEntrenamiento } from "@/app/actions/entrenamiento.actions";

export function PanelDebug({ log }: { log: TurnoEntrenamiento[] }) {
  function exportar() {
    const blob = new Blob([JSON.stringify(log, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `entrenamiento-${new Date().toISOString()}.json`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto rounded-[14px] border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-[#F0F0F0]">Panel de debug</h2>
        <Button
          variant="outline"
          size="sm"
          disabled={log.length === 0}
          onClick={exportar}
          className="gap-1.5"
        >
          <Download className="size-3.5" />
          Exportar JSON
        </Button>
      </div>

      {log.length === 0 && (
        <p className="text-[12px] text-[#666]">Todavía no hay turnos en esta prueba.</p>
      )}

      <div className="flex flex-col gap-3">
        {log.map((turno, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-[#141414] p-3 text-[12px]"
          >
            <div className="mb-1.5 flex items-center gap-1.5 text-[#666]">
              <Clock className="size-3" />
              {new Date(turno.timestamp).toLocaleTimeString("es-CO")}
            </div>
            <div className="mb-1 flex items-center gap-1.5 text-[#AAA]">
              <Cpu className="size-3" />
              {turno.modeloUsado} — {turno.razon}
            </div>
            <div className="mb-1 flex items-center gap-1.5 text-[#AAA]">
              <Coins className="size-3" />
              {turno.tokensEntrada} entrada / {turno.tokensSalida} salida
            </div>
            {turno.ragChunks.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[#666]">
                  <BookOpen className="size-3" />
                  Fragmentos RAG recuperados
                </div>
                <div className="flex flex-wrap gap-1">
                  {turno.ragChunks.map((f, j) => (
                    <span
                      key={j}
                      className="rounded-full border border-border bg-[#1A1A1A] px-2 py-0.5 text-[10px] text-[#999]"
                    >
                      {f.seccion} · {Math.round(f.similarity * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
