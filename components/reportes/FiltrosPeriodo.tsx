"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PERIODO_PRESETS, type PeriodoPreset } from "@/lib/services/reportes.service";
import { Button } from "@/components/ui/button";

export function FiltrosPeriodo({
  periodoActivo,
  esPersonalizado,
  desdeActual,
  hastaActual,
}: {
  periodoActivo: PeriodoPreset;
  esPersonalizado: boolean;
  desdeActual?: string;
  hastaActual?: string;
}) {
  const router = useRouter();
  const [mostrarPersonalizado, setMostrarPersonalizado] = useState(esPersonalizado);
  const [desde, setDesde] = useState(desdeActual ?? "");
  const [hasta, setHasta] = useState(hastaActual ?? "");

  function aplicarPersonalizado() {
    if (!desde || !hasta) return;
    router.push(`/reportes?desde=${desde}&hasta=${hasta}`);
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap gap-0.5 rounded-lg border border-border bg-card p-1">
        {PERIODO_PRESETS.map((p) => (
          <Link
            key={p.valor}
            href={`/reportes?periodo=${p.valor}`}
            onClick={() => setMostrarPersonalizado(false)}
            className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
              !esPersonalizado && periodoActivo === p.valor
                ? "bg-[#222] text-[#F0F0F0]"
                : "text-[#444] hover:text-[#888]"
            }`}
          >
            {p.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMostrarPersonalizado((v) => !v)}
          className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
            esPersonalizado ? "bg-[#222] text-[#F0F0F0]" : "text-[#444] hover:text-[#888]"
          }`}
        >
          Personalizado
        </button>
      </div>
      {mostrarPersonalizado && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-[13px] text-foreground outline-none"
          />
          <span className="text-[13px] text-[#555]">a</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-[13px] text-foreground outline-none"
          />
          <Button size="sm" onClick={aplicarPersonalizado} disabled={!desde || !hasta}>
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
}
