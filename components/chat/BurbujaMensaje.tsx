import type { MensajeChat } from "@/lib/types";

export function BurbujaMensaje({
  mensaje,
}: {
  mensaje: Pick<MensajeChat, "id" | "rol" | "mensaje">;
}) {
  const esUsuario = mensaje.rol === "user";
  return (
    <div className={`flex ${esUsuario ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
          esUsuario
            ? "bg-primary text-primary-foreground"
            : "bg-[#1A1A1A] text-[#E5E5E5]"
        }`}
      >
        {mensaje.mensaje}
      </div>
    </div>
  );
}
