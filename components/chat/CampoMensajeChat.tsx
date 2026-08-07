"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

export function CampoMensajeChat({
  onEnviar,
  pending,
  placeholder = "Escribe tu pregunta...",
  onFocus,
}: {
  onEnviar: (mensaje: string) => void;
  pending: boolean;
  placeholder?: string;
  onFocus?: () => void;
}) {
  const [valor, setValor] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function ajustarAltura() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function enviarSiHayTexto() {
    const mensaje = valor.trim();
    if (!mensaje || pending) return;
    onEnviar(mensaje);
    setValor("");
    requestAnimationFrame(ajustarAltura);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      enviarSiHayTexto();
    }
  }

  return (
    <div className="flex items-end gap-2 rounded-3xl border border-border bg-[#1A1A1A] px-3 py-2">
      <textarea
        ref={textareaRef}
        value={valor}
        onChange={(e) => {
          setValor(e.target.value);
          ajustarAltura();
        }}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={pending}
        rows={1}
        className="max-h-[160px] flex-1 resize-none bg-transparent py-1.5 text-[15px] text-[#F0F0F0] placeholder:text-[#555] outline-none disabled:opacity-50"
      />
      <button
        type="button"
        onClick={enviarSiHayTexto}
        disabled={pending || !valor.trim()}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
      >
        <ArrowUp className="size-4" />
      </button>
    </div>
  );
}
