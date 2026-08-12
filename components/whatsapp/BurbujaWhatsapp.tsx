import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { MensajeWhatsapp } from "@/lib/types";

export function BurbujaWhatsapp({ mensaje }: { mensaje: MensajeWhatsapp }) {
  const esSaliente = mensaje.direccion === "saliente";

  return (
    <div className={`flex flex-col ${esSaliente ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
          esSaliente ? "bg-primary/15 text-[#F0F0F0]" : "bg-[#1A1A1A] text-[#E5E5E5]"
        }`}
      >
        {mensaje.contenido}
      </div>
      <span className="mt-1 px-1 text-[10px] text-[#555]">
        {format(new Date(mensaje.created_at), "d MMM, HH:mm", { locale: es })}
      </span>
    </div>
  );
}
