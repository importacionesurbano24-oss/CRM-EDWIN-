"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopiarLinkButton({ token }: { token: string }) {
  function copiar() {
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/cotizacion/${token}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copiado."))
      .catch(() => toast.error("No se pudo copiar el link."));
  }

  return (
    <Button variant="secondary" size="sm" onClick={copiar}>
      Copiar link
    </Button>
  );
}
