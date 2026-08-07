"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ClienteConEtapa } from "@/lib/types";
import {
  coincideRangoFecha,
  RANGO_FECHA_META,
  RANGOS_FECHA,
  type RangoFecha,
} from "@/lib/ui/rangoFecha";

const PRESETS = RANGOS_FECHA.filter((r) => r !== "personalizado");

export function FiltroFecha({ clientes }: { clientes: ClienteConEtapa[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rangoActual = (searchParams.get("rango") as RangoFecha | null) ?? "todos";
  const [mostrarPersonalizado, setMostrarPersonalizado] = useState(
    rangoActual === "personalizado"
  );
  const [desde, setDesde] = useState(searchParams.get("desde") ?? "");
  const [hasta, setHasta] = useState(searchParams.get("hasta") ?? "");

  function irA(params: Record<string, string | null>) {
    const nuevos = new URLSearchParams(searchParams.toString());
    for (const [clave, valor] of Object.entries(params)) {
      if (valor) nuevos.set(clave, valor);
      else nuevos.delete(clave);
    }
    router.push(`${pathname}?${nuevos.toString()}`);
  }

  function elegirPreset(rango: RangoFecha) {
    if (rango === "personalizado") {
      setMostrarPersonalizado(true);
      return;
    }
    setMostrarPersonalizado(false);
    irA({ rango: rango === "todos" ? null : rango, desde: null, hasta: null });
  }

  function aplicarPersonalizado() {
    irA({ rango: "personalizado", desde: desde || null, hasta: hasta || null });
  }

  return (
    <div className="flex flex-col gap-3 px-4 md:px-9">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((rango) => {
          const count = clientes.filter((c) =>
            coincideRangoFecha(c.proxima_accion_fecha, rango)
          ).length;
          const activo = rangoActual === rango;
          return (
            <button
              key={rango}
              type="button"
              onClick={() => elegirPreset(rango)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activo
                  ? "bg-brand-lime text-brand-lime-foreground"
                  : "border border-border bg-card text-[#999] hover:border-[#333] hover:text-foreground"
              }`}
            >
              {RANGO_FECHA_META[rango]} ({count})
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => elegirPreset("personalizado")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            rangoActual === "personalizado"
              ? "bg-brand-lime text-brand-lime-foreground"
              : "border border-border bg-card text-[#999] hover:border-[#333] hover:text-foreground"
          }`}
        >
          {RANGO_FECHA_META.personalizado}
        </button>
      </div>

      {mostrarPersonalizado && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#555]">Desde</label>
            <Input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-[150px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#555]">Hasta</label>
            <Input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-[150px]"
            />
          </div>
          <Button size="sm" onClick={aplicarPersonalizado}>
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
}
