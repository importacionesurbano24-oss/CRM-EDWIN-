import { Sparkles } from "lucide-react";
import type { MensajeChat } from "@/lib/types";

export function BurbujaMensaje({
  mensaje,
}: {
  mensaje: Pick<MensajeChat, "id" | "rol" | "mensaje">;
}) {
  const esUsuario = mensaje.rol === "user";

  if (esUsuario) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-3xl bg-[#2A2A2A] px-4 py-2.5 text-[15px] whitespace-pre-wrap text-[#F0F0F0]">
          {mensaje.mensaje}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <Sparkles className="size-3.5 text-primary" />
      </div>
      <div className="max-w-[85%] pt-1 text-[15px] leading-relaxed whitespace-pre-wrap text-[#E5E5E5]">
        {mensaje.mensaje}
      </div>
    </div>
  );
}
