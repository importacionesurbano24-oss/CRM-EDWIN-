"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CampoMensajeChat({
  onEnviar,
  pending,
  placeholder = "Escribe tu pregunta...",
}: {
  onEnviar: (mensaje: string) => void;
  pending: boolean;
  placeholder?: string;
}) {
  const [valor, setValor] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const mensaje = valor.trim();
    if (!mensaje || pending) return;
    onEnviar(mensaje);
    setValor("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={placeholder}
        disabled={pending}
      />
      <Button type="submit" size="icon" disabled={pending || !valor.trim()}>
        <Send className="size-4" />
      </Button>
    </form>
  );
}
