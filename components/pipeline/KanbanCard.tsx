"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import type { ClienteConEtapa } from "@/lib/types";
import { calcularUrgencia } from "@/lib/ui/urgencia";
import { actionSugerirProximaAccion } from "@/app/actions/agente.actions";
import type { Sugerencia } from "@/lib/claude/agente";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClienteAvatar } from "./ClienteAvatar";

export function KanbanCard({ cliente }: { cliente: ClienteConEtapa }) {
  const urgencia = calcularUrgencia(cliente.proxima_accion_fecha);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [sugerencia, setSugerencia] = useState<Sugerencia | null>(null);

  function generar() {
    startTransition(async () => {
      const result = await actionSugerirProximaAccion(cliente.id);
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
      <div className="rounded-[10px] border border-border bg-card p-3.5 transition-colors hover:border-[#2E2E2E] hover:bg-[#141414]">
        <Link href={`/clientes/${cliente.id}`} className="block">
          <div className="mb-2.5 flex items-center gap-2.5">
            <ClienteAvatar id={cliente.id} nombre={cliente.nombre} />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-[#F0F0F0]">
                {cliente.nombre}
              </div>
              <div className="text-[11px] text-[#444]">
                {cliente.telefono_whatsapp}
              </div>
            </div>
          </div>
          <div className="mb-2.5 line-clamp-2 text-xs text-[#555]">
            {cliente.proxima_accion || "Sin próxima acción"}
          </div>
        </Link>

        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[11px] font-semibold"
            style={{ color: urgencia.color }}
          >
            {urgencia.label}
          </span>
          {cliente.etapa === "cotizo" && (
            <button
              type="button"
              onClick={abrirModal}
              className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/25"
            >
              <Sparkles className="size-3" />
              Mensaje
            </button>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Mensaje de seguimiento — {cliente.nombre}
            </DialogTitle>
          </DialogHeader>

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
