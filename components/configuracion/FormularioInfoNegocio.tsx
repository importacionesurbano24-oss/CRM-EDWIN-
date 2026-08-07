"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { actionGuardarInfoNegocio } from "@/app/actions/chat.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function FormularioInfoNegocio({
  contenidoInicial,
}: {
  contenidoInicial: string;
}) {
  const [contenido, setContenido] = useState(contenidoInicial);
  const [pending, startTransition] = useTransition();

  function guardar() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("contenido", contenido);
      const result = await actionGuardarInfoNegocio(formData);
      if (result.data) {
        toast.success("Información guardada.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="max-w-2xl rounded-[14px] border border-border bg-card p-6">
      <div className="mb-4 flex flex-col gap-2">
        <Label htmlFor="contenido">Catálogo, garantías y objeciones</Label>
        <Textarea
          id="contenido"
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          rows={16}
          placeholder="Ej: El colchón ortopédico XL tiene garantía de 10 años contra hundimiento..."
        />
      </div>
      <Button onClick={guardar} disabled={pending}>
        {pending ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  );
}
