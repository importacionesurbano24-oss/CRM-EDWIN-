"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Save, Download } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  actionGuardarPromptActivo,
  actionCargarPromptActivo,
} from "@/app/actions/entrenamiento.actions";
import { SelectorModoModelo, type ModoModelo } from "./SelectorModoModelo";
import { ToggleRAG } from "./ToggleRAG";

export function EditorPromptPanel({
  systemPrompt,
  onChangeSystemPrompt,
  modoModelo,
  onChangeModoModelo,
  useRag,
  onChangeUseRag,
  clienteId,
  onChangeClienteId,
  clientes,
}: {
  systemPrompt: string;
  onChangeSystemPrompt: (valor: string) => void;
  modoModelo: ModoModelo;
  onChangeModoModelo: (modo: ModoModelo) => void;
  useRag: boolean;
  onChangeUseRag: (activo: boolean) => void;
  clienteId: string | null;
  onChangeClienteId: (id: string | null) => void;
  clientes: { id: string; nombre: string }[];
}) {
  const [pending, startTransition] = useTransition();

  function guardar() {
    startTransition(async () => {
      // La tabla solo admite 'basico'/'avanzado' — en modo "Automático" se
      // guarda como 'basico' (el modo automático en sí no es persistible,
      // es una elección de esta pantalla, no del prompt guardado).
      const nivelIa = modoModelo === "auto" ? "basico" : modoModelo;
      const nombre = `Prueba ${format(new Date(), "d MMM yyyy, HH:mm", { locale: es })}`;
      const result = await actionGuardarPromptActivo({
        name: nombre,
        systemPrompt,
        nivelIa,
        useRag,
      });
      if (result.data) {
        toast.success("Prompt guardado como activo.");
      } else {
        toast.error(result.error);
      }
    });
  }

  function cargar() {
    startTransition(async () => {
      const result = await actionCargarPromptActivo();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (!result.data) {
        toast.info("Todavía no hay ningún prompt guardado como activo.");
        return;
      }
      onChangeSystemPrompt(result.data.system_prompt);
      onChangeModoModelo(result.data.nivel_ia);
      onChangeUseRag(result.data.use_rag);
      toast.success("Prompt activo cargado.");
    });
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-[14px] border border-border bg-card p-4">
      <div className="flex flex-1 flex-col">
        <Label htmlFor="system-prompt">System prompt</Label>
        <Textarea
          id="system-prompt"
          value={systemPrompt}
          onChange={(e) => onChangeSystemPrompt(e.target.value)}
          rows={14}
          className="mt-2 flex-1 font-mono text-[13px]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Modelo</Label>
        <SelectorModoModelo value={modoModelo} onChange={onChangeModoModelo} />
      </div>

      <ToggleRAG value={useRag} onChange={onChangeUseRag} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="contexto-cliente">Contexto</Label>
        <Select
          value={clienteId ?? "negocio"}
          onValueChange={(value) =>
            onChangeClienteId(value === "negocio" ? null : (value ?? null))
          }
        >
          <SelectTrigger id="contexto-cliente" className="w-full">
            <SelectValue placeholder="Negocio general" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="negocio">Negocio general</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-auto flex gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-1.5"
          disabled={pending}
          onClick={cargar}
        >
          <Download className="size-3.5" />
          Cargar prompt actual
        </Button>
        <Button className="flex-1 gap-1.5" disabled={pending} onClick={guardar}>
          <Save className="size-3.5" />
          Guardar como activo
        </Button>
      </div>
    </div>
  );
}
