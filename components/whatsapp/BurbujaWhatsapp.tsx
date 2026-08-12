import type { MensajeWhatsapp } from "@/lib/types";

export function BurbujaWhatsapp({ mensaje }: { mensaje: MensajeWhatsapp }) {
  return (
    <div className={`flex ${mensaje.direccion === "saliente" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
          mensaje.direccion === "saliente"
            ? "bg-primary/15 text-[#F0F0F0]"
            : "bg-[#1A1A1A] text-[#E5E5E5]"
        }`}
      >
        {mensaje.contenido}
      </div>
    </div>
  );
}
