"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import {
  actionSugerirProximaAccion,
} from "@/app/actions/agente.actions";
import type { Sugerencia } from "@/lib/claude/agente";
import { Button } from "@/components/ui/button";

export function SugerenciaAgente({ clienteId }: { clienteId: string }) {
  const [pending, startTransition] = useTransition();
  const [sugerencia, setSugerencia] = useState<Sugerencia | null>(null);

  function pedirSugerencia() {
    startTransition(async () => {
      const result = await actionSugerirProximaAccion(clienteId);
      if (result.data) {
        setSugerencia(result.data);
      } else {
        toast.error(result.error);
      }
    });
  }

  function copiarMensaje() {
    if (!sugerencia) return;
    navigator.clipboard
      .writeText(sugerencia.mensaje_sugerido)
      .then(() => toast.success("Mensaje copiado."))
      .catch(() => toast.error("No se pudo copiar."));
  }

  return (
    <div className="rounded-[14px] border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide text-[#555] uppercase">
          Sugerencia del agente
        </h2>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={pedirSugerencia}
          className="gap-1.5"
        >
          <Sparkles className="size-3.5" />
          {pending ? "Pensando..." : sugerencia ? "Regenerar" : "Sugerir"}
        </Button>
      </div>

      {!sugerencia && !pending && (
        <p className="text-sm text-[#555]">
          Pídele al agente que revise el historial de este cliente y te
          sugiera qué hacer.
        </p>
      )}

      {sugerencia && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-1 text-[11px] tracking-wide text-[#444] uppercase">
              Próxima acción
            </div>
            <p className="text-sm text-[#F0F0F0]">
              {sugerencia.proxima_accion}
            </p>
          </div>
          <div>
            <div className="mb-1 text-[11px] tracking-wide text-[#444] uppercase">
              Mensaje sugerido
            </div>
            <p className="rounded-lg bg-[#1A1A1A] p-3 text-sm text-[#D0D0D0]">
              {sugerencia.mensaje_sugerido}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={copiarMensaje}
            className="w-fit"
          >
            Copiar mensaje
          </Button>
        </div>
      )}
    </div>
  );
}
