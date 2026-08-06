"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { actionRegistrarSeguimiento } from "@/app/actions/seguimientos.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ETAPA_META, ETAPA_ORDEN } from "@/lib/ui/etapa";
import type { Etapa } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Guardando..." : "Guardar seguimiento"}
    </Button>
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

  useEffect(() => {
    if (!state) return;
    if (state.data) {
      toast.success("Seguimiento guardado.");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="cliente_id" value={clienteId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="etapa">Etapa</Label>
        <Select name="etapa" defaultValue={etapaActual ?? "prospecto"}>
          <SelectTrigger id="etapa" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ETAPA_ORDEN.map((etapa) => (
              <SelectItem key={etapa} value={etapa}>
                {ETAPA_META[etapa].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="proxima_accion">Próxima acción</Label>
          <Input
            id="proxima_accion"
            name="proxima_accion"
            placeholder="Llamar para confirmar entrega"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="proxima_accion_fecha">Fecha</Label>
          <Input
            id="proxima_accion_fecha"
            name="proxima_accion_fecha"
            type="date"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea
          id="notas"
          name="notas"
          placeholder="¿Qué pasó en este contacto?"
          rows={3}
        />
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
