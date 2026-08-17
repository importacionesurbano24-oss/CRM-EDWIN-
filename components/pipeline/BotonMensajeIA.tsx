"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { actionSugerirProximaAccion } from "@/app/actions/agente.actions";
import type { Sugerencia } from "@/lib/claude/agente";
import { useNivelIA } from "@/lib/hooks/useNivelIA";
import { Button } from "@/components/ui/button";
import { SelectorNivelIA } from "@/components/shared/SelectorNivelIA";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function BotonMensajeIA({
  clienteId,
  clienteNombre,
}: {
  clienteId: string;
  clienteNombre: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [sugerencia, setSugerencia] = useState<Sugerencia | null>(null);
  const [nivel, setNivel] = useNivelIA();

  function generar() {
    startTransition(async () => {
      const result = await actionSugerirProximaAccion(clienteId, nivel);
      if (result.data) {
        setSugerencia(result.data);
      } else {
        toast.error(result.error);
      }
    });
  }

  function abrirModal() {
    setOpen(true);
    if (!sugerencia) generar();
  }

  function copiarMensaje() {
    if (!sugerencia) return;
    navigator.clipboard
      .writeText(sugerencia.mensaje_sugerido)
      .then(() => toast.success("Mensaje copiado."))
      .catch(() => toast.error("No se pudo copiar."));
  }

  return (
    <>
      <button
        type="button"
        onClick={abrirModal}
        className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/25"
      >
        <Sparkles className="size-3" />
        Mensaje
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Mensaje de seguimiento — {clienteNombre}
            </DialogTitle>
          </DialogHeader>

          <SelectorNivelIA value={nivel} onChange={setNivel} />

          {pending && (
            <p className="text-sm text-[#555]">Generando mensaje...</p>
          )}

          {!pending && sugerencia && (
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
              <div className="flex gap-2">
                <Button size="sm" onClick={copiarMensaje}>
                  Copiar mensaje
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={generar}
                >
                  Regenerar
                </Button>
              </div>
            </div>
          )}

          {!pending && !sugerencia && (
            <p className="text-sm text-[#555]">
              No se pudo generar el mensaje. Intenta de nuevo.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
