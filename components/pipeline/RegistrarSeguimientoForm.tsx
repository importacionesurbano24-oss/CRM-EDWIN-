"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { actionRegistrarSeguimiento } from "@/app/actions/seguimientos.actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ETAPA_META, ETAPA_ORDEN } from "@/lib/ui/etapa";
import type { Etapa } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-60"
    >
      {pending ? "Guardando..." : "Guardar seguimiento"}
    </button>
  );
}

export function RegistrarSeguimientoForm({
  clienteId,
  etapaActual,
}: {
  clienteId: string;
  etapaActual: Etapa | null;
}) {
  const [state, formAction] = useActionState(
    actionRegistrarSeguimiento,
    undefined
  );
  const [etapa, setEtapa] = useState<Etapa>(etapaActual ?? "prospecto");

  useEffect(() => {
    if (!state) return;
    if (state.data) {
      toast.success("Seguimiento guardado.");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="cliente_id" value={clienteId} />
      <input type="hidden" name="etapa" value={etapa} />

      <div>
        <div className="mb-2.5 text-[11px] font-semibold tracking-wide text-[#888] uppercase">
          Etapa del cliente
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ETAPA_ORDEN.map((opcion) => {
            const activa = opcion === etapa;
            const color = ETAPA_META[opcion].color;
            return (
              <button
                key={opcion}
                type="button"
                onClick={() => setEtapa(opcion)}
                className="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors"
                style={
                  activa
                    ? { borderColor: color, background: `${color}22`, color }
                    : { borderColor: "#3A3A3A", background: "#1A1A1A", color: "#888" }
                }
              >
                {ETAPA_META[opcion].label}
                {activa && " ✓"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notas">¿Qué pasó?</Label>
        <Textarea
          id="notas"
          name="notas"
          placeholder="Describe el contacto, respuesta del cliente, objeciones, interés..."
          rows={4}
          className="bg-background"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="proxima_accion">Próxima acción</Label>
          <Input
            id="proxima_accion"
            name="proxima_accion"
            placeholder="Llamar para confirmar entrega"
            className="bg-background"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="proxima_accion_fecha">Fecha</Label>
          <Input
            id="proxima_accion_fecha"
            name="proxima_accion_fecha"
            type="date"
            className="bg-background"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="link_cotizacion">
          Link de cotización externa (opcional)
        </Label>
        <Input
          id="link_cotizacion"
          name="link_cotizacion"
          type="url"
          placeholder="https://..."
          className="bg-background"
        />
        <p className="text-xs text-[#555]">
          Si ya cotizaste a este cliente en otra herramienta, pega aquí el
          link. Queda guardado en el historial y el agente lo lee al sugerir
          la próxima acción.
        </p>
      </div>

      <SubmitButton />
    </form>
  );
}
