"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RANGO_FECHA_META, RANGOS_FECHA, type RangoFecha } from "@/lib/ui/rangoFecha";

const PRESETS = RANGOS_FECHA.filter((r) => r !== "personalizado");

export function FiltroFecha() {
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
    <div className="flex flex-col gap-2.5 px-4 md:px-9">
      <div className="flex flex-wrap items-center gap-1.5">
        <Calendar className="size-3.5 text-[#555]" />
        {PRESETS.map((rango) => (
          <button
            key={rango}
            type="button"
            onClick={() => elegirPreset(rango)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              rangoActual === rango
                ? "bg-primary text-primary-foreground"
                : "bg-card text-[#888] hover:text-foreground"
            }`}
          >
            {RANGO_FECHA_META[rango]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => elegirPreset("personalizado")}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            rangoActual === "personalizado"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-[#888] hover:text-foreground"
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
