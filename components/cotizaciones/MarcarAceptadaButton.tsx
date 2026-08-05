"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { actionMarcarAceptada } from "@/app/actions/cotizaciones.actions";
import { Button } from "@/components/ui/button";

export function MarcarAceptadaButton({ cotizacionId }: { cotizacionId: string }) {
  const [pending, startTransition] = useTransition();

  function marcar() {
    startTransition(async () => {
      const result = await actionMarcarAceptada(cotizacionId);
      if (result.data) {
        toast.success("Marcada como aceptada.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={marcar}>
      {pending ? "..." : "Marcar aceptada"}
    </Button>
  );
}
