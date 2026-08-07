"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Upload } from "lucide-react";
import { actionCrearCliente } from "@/app/actions/clientes.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ETAPA_META, ETAPA_ORDEN } from "@/lib/ui/etapa";
import type { Etapa } from "@/lib/types";

export function NuevoClienteDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [etapa, setEtapa] = useState<Etapa>("prospecto");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setEtapa("prospecto");
    setPreviewUrl(null);
    formRef.current?.reset();
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await actionCrearCliente(formData);

      if (result.data) {
        toast.success(`${result.data.nombre} agregado.`);
        if (result.error) toast.error(result.error);
        setOpen(false);
        resetForm();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <SheetTrigger
        render={
          <Button className="gap-2">
            <Plus className="size-3.5" />
            Nuevo cliente
          </Button>
        }
      />
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Nuevo cliente</SheetTitle>
        </SheetHeader>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              name="nombre"
              required
              placeholder="María González"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="telefono_whatsapp">WhatsApp</Label>
            <Input
              id="telefono_whatsapp"
              name="telefono_whatsapp"
              required
              placeholder="+57 311 234 5678"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Correo (opcional)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="maria@correo.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="origen">Origen</Label>
              <Select name="origen" defaultValue="walk-in">
                <SelectTrigger id="origen" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">Llegó a la tienda</SelectItem>
                  <SelectItem value="referido">Referido</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="etapa">Etapa</Label>
              <input type="hidden" name="etapa" value={etapa} />
              <Select
                value={etapa}
                onValueChange={(value) => setEtapa((value as Etapa) ?? "prospecto")}
              >
                <SelectTrigger id="etapa" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ETAPA_ORDEN.map((opcion) => (
                    <SelectItem key={opcion} value={opcion}>
                      {ETAPA_META[opcion].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="proxima_accion">Próxima acción</Label>
              <Input
                id="proxima_accion"
                name="proxima_accion"
                placeholder="Enviar cotización"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="proxima_accion_fecha">Fecha</Label>
              <Input
                id="proxima_accion_fecha"
                name="proxima_accion_fecha"
                type="date"
              />
            </div>
          </div>

          {etapa === "compro" && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-[#141414] p-3.5">
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="foto_pedido">Foto del pedido (opcional)</Label>
                <input
                  ref={fileInputRef}
                  id="foto_pedido"
                  name="foto_pedido"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-28 items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#2A2A2A] bg-[#111] transition-colors hover:border-[#3A3A3A]"
                >
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Vista previa"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex flex-col items-center gap-1.5 text-xs text-[#555]">
                      <Upload className="size-4" />
                      Toca para subir una foto
                    </span>
                  )}
                </button>
              </div>
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="monto_pedido">Monto del pedido</Label>
                <Input
                  id="monto_pedido"
                  name="monto_pedido"
                  type="number"
                  min="0"
                  placeholder="2000000"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="notas">Observaciones (opcional)</Label>
            <Textarea
              id="notas"
              name="notas"
              placeholder="Algo más para tener en cuenta de este cliente..."
              rows={3}
            />
          </div>

          <SheetFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar cliente"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
