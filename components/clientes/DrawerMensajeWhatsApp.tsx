"use client";

import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function DrawerMensajeWhatsApp({
  open,
  onOpenChange,
  clienteId,
  clienteNombre,
  telefono,
  mensaje,
  onMensajeChange,
  generando,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  clienteNombre: string;
  telefono: string | null;
  mensaje: string;
  onMensajeChange: (mensaje: string) => void;
  generando: boolean;
}) {
  const router = useRouter();

  function irAWhatsapp() {
    onOpenChange(false);
    router.push(`/whatsapp?cliente=${clienteId}&mensaje=${encodeURIComponent(mensaje)}`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle>Mensaje de WhatsApp — {clienteNombre}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4">
          <div>
            <div className="mb-1.5 text-[11px] tracking-wide text-[#444] uppercase">
              Para
            </div>
            <p className="rounded-lg bg-[#1A1A1A] px-3 py-2 text-sm text-[#D0D0D0]">
              {telefono ?? "Sin número registrado"}
            </p>
          </div>

          <div className="flex flex-1 flex-col">
            <div className="mb-1.5 text-[11px] tracking-wide text-[#444] uppercase">
              Mensaje
            </div>
            {generando && !mensaje ? (
              <p className="text-sm text-[#555]">Generando mensaje...</p>
            ) : (
              <Textarea
                value={mensaje}
                onChange={(e) => onMensajeChange(e.target.value)}
                rows={10}
                placeholder="Escribe el mensaje..."
                className="flex-1"
              />
            )}
          </div>

          <Button
            onClick={irAWhatsapp}
            disabled={generando || !mensaje.trim() || !telefono}
            className="gap-1.5"
          >
            <Send className="size-3.5" />
            Ir a WhatsApp →
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
