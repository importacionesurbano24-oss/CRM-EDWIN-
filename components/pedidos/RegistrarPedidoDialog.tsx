"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Upload } from "lucide-react";
import { actionRegistrarPedido } from "@/app/actions/pedidos.actions";
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
import { formatMoneda } from "@/lib/ui/cotizacion";

interface CotizacionOpcion {
  id: string;
  cliente_id: string;
  monto_total: number;
}

const hoyISO = () => new Date().toISOString().slice(0, 10);

export function RegistrarPedidoDialog({
  clientes,
  cotizaciones,
}: {
  clientes: { id: string; nombre: string }[];
  cotizaciones: CotizacionOpcion[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [clienteId, setClienteId] = useState("");
  const [cotizacionId, setCotizacionId] = useState("");
  const [monto, setMonto] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const cotizacionesDelCliente = useMemo(
    () => cotizaciones.filter((c) => c.cliente_id === clienteId),
    [cotizaciones, clienteId]
  );

  function resetForm() {
    setClienteId("");
    setCotizacionId("");
    setMonto("");
    setPreviewUrl(null);
    formRef.current?.reset();
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await actionRegistrarPedido(formData);

      if (result.data) {
        toast.success("Pedido registrado.");
        setOpen(false);
        resetForm();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="size-3.5" />
            Registrar pedido
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pedido</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="cliente_id">Cliente</Label>
            <input type="hidden" name="cliente_id" value={clienteId} />
            <Select
              value={clienteId}
              onValueChange={(value) => {
                setClienteId(value ?? "");
                setCotizacionId("");
              }}
            >
              <SelectTrigger id="cliente_id" className="w-full">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {clienteId && cotizacionesDelCliente.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="cotizacion_id">
                Cotización relacionada (opcional)
              </Label>
              <input type="hidden" name="cotizacion_id" value={cotizacionId} />
              <Select
                value={cotizacionId}
                onValueChange={(value) => {
                  setCotizacionId(value ?? "");
                  const cot = cotizacionesDelCliente.find(
                    (c) => c.id === value
                  );
                  if (cot) setMonto(String(cot.monto_total));
                }}
              >
                <SelectTrigger id="cotizacion_id" className="w-full">
                  <SelectValue placeholder="Ninguna" />
                </SelectTrigger>
                <SelectContent>
                  {cotizacionesDelCliente.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {formatMoneda(c.monto_total)} — {c.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="monto">Monto</Label>
              <Input
                id="monto"
                name="monto"
                type="number"
                min="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="2000000"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fecha_compra">Fecha</Label>
              <Input
                id="fecha_compra"
                name="fecha_compra"
                type="date"
                defaultValue={hoyISO()}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="foto">Foto del pedido</Label>
            <input
              ref={fileInputRef}
              id="foto"
              name="foto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFotoChange}
              required
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-32 items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#2A2A2A] bg-[#111] transition-colors hover:border-[#3A3A3A]"
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

          <DialogFooter>
            <Button type="submit" disabled={pending || !clienteId}>
              {pending ? "Guardando..." : "Guardar pedido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
