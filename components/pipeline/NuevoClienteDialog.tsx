"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { actionCrearCliente } from "@/app/actions/clientes.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ETAPA_META, ETAPA_ORDEN } from "@/lib/ui/etapa";

export function NuevoClienteDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await actionCrearCliente(formData);

      if (result.data) {
        toast.success(`${result.data.nombre} agregado.`);
        if (result.error) toast.error(result.error);
        setOpen(false);
        formRef.current?.reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="size-3.5" />
            Nuevo cliente
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
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
              <Select name="etapa" defaultValue="prospecto">
                <SelectTrigger id="etapa" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ETAPA_ORDEN.map((etapa) => (
                    <SelectItem key={etapa} value={etapa}>
                      {ETAPA_META[etapa].label}
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
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
