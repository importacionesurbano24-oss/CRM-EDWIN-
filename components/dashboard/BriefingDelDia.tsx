"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, X, Check } from "lucide-react";
import {
  actionRedactarBriefing,
  actionEjecutarAlertaBriefing,
} from "@/app/actions/briefing.actions";
import {
  textoPlantilla,
  type AlertaBriefing,
} from "@/lib/services/briefing.service";
import { ETAPA_META } from "@/lib/ui/etapa";
import { useNivelIA } from "@/lib/hooks/useNivelIA";
import { Button } from "@/components/ui/button";
import { SelectorNivelIA } from "@/components/shared/SelectorNivelIA";

const COLOR_REGLA: Record<AlertaBriefing["regla"], string> = {
  whatsapp_sin_responder: "#25D366",
  cotizo_frio: "#FF6B6B",
  posventa_referido: "#FF9F43",
  compro_posventa: "#CCFF00",
  cotizo_seguimiento: "#FFDD00",
  sin_accion: "#888888",
};

interface ItemBriefing {
  alerta: AlertaBriefing;
  situacion: string;
  accionSugerida: string;
}

export function BriefingDelDia({
  alertas,
}: {
  alertas: AlertaBriefing[];
}) {
  const [items, setItems] = useState<ItemBriefing[]>(() =>
    alertas.map((alerta) => ({ alerta, ...textoPlantilla(alerta) }))
  );
  const [ocultos, setOcultos] = useState<Set<string>>(new Set());
  const [ejecutando, setEjecutando] = useState<Set<string>>(new Set());
  const [mejorando, setMejorando] = useState(false);
  const [nivel, setNivel] = useNivelIA();

  const visibles = items.filter((item) => !ocultos.has(item.alerta.clienteId));

  async function mejorarConIA() {
    setMejorando(true);
    const result = await actionRedactarBriefing(items.map((i) => i.alerta), nivel);
    setMejorando(false);

    if (!result.data) {
      toast.error(result.error);
      return;
    }
    const porCliente = new Map(result.data.map((t) => [t.clienteId, t]));
    setItems((prev) =>
      prev.map((item) => {
        const texto = porCliente.get(item.alerta.clienteId);
        return texto
          ? { ...item, situacion: texto.situacion, accionSugerida: texto.accionSugerida }
          : item;
      })
    );
  }

  function ignorar(clienteId: string) {
    setOcultos((prev) => new Set(prev).add(clienteId));
  }

  async function ejecutar(alerta: AlertaBriefing) {
    setEjecutando((prev) => new Set(prev).add(alerta.clienteId));
    const result = await actionEjecutarAlertaBriefing(alerta);
    setEjecutando((prev) => {
      const next = new Set(prev);
      next.delete(alerta.clienteId);
      return next;
    });

    if (!result.data) {
      toast.error(result.error);
      return;
    }
    toast.success(`Seguimiento registrado para ${alerta.clienteNombre}.`);
    ignorar(alerta.clienteId);
  }

  if (alertas.length === 0) return null;

  return (
    <div className="mb-8 rounded-[14px] border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <h2 className="text-sm font-semibold tracking-wide text-[#888] uppercase">
            Briefing del día
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <SelectorNivelIA value={nivel} onChange={setNivel} />
          <Button
            variant="outline"
            size="sm"
            disabled={mejorando}
            onClick={mejorarConIA}
            className="gap-1.5"
          >
            <Sparkles className="size-3.5" />
            {mejorando ? "Redactando..." : "Mejorar con IA"}
          </Button>
        </div>
      </div>

      {visibles.length === 0 && (
        <p className="text-sm text-[#555]">
          Ya revisaste todas las alertas de hoy.
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        {visibles.map(({ alerta, situacion, accionSugerida }) => (
          <div
            key={alerta.clienteId}
            className="flex flex-col gap-3 rounded-xl border border-border bg-[#141414] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: COLOR_REGLA[alerta.regla] }}
                />
                <span className="text-sm font-semibold text-[#F0F0F0]">
                  {alerta.clienteNombre}
                </span>
                {alerta.etapaSugerida && (
                  <span className="text-[11px] text-[#555]">
                    {ETAPA_META[alerta.etapaActual].label} →{" "}
                    {ETAPA_META[alerta.etapaSugerida].label}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-[#888]">{situacion}</p>
              <p className="mt-0.5 text-[13px] text-[#D0D0D0]">
                {accionSugerida}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5"
                disabled={ejecutando.has(alerta.clienteId)}
                onClick={() => ejecutar(alerta)}
              >
                <Check className="size-3.5" />
                {ejecutando.has(alerta.clienteId) ? "..." : "Ejecutar"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => ignorar(alerta.clienteId)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
