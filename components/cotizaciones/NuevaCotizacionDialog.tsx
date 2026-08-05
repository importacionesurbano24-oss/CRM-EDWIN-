"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { actionCrearCotizacion } from "@/app/actions/cotizaciones.actions";
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

interface Fila {
  key: string;
  nombre: string;
  cantidad: string;
  precio_unitario: string;
}

function filaVacia(): Fila {
  return { key: crypto.randomUUID(), nombre: "", cantidad: "1", precio_unitario: "" };
}

export function NuevaCotizacionDialog({
  clientes,
}: {
  clientes: { id: string; nombre: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [clienteId, setClienteId] = useState("");
  const [filas, setFilas] = useState<Fila[]>([filaVacia()]);

  const total = filas.reduce((suma, f) => {
    const cantidad = Number(f.cantidad) || 0;
    const precio = Number(f.precio_unitario) || 0;
    return suma + cantidad * precio;
  }, 0);

  function actualizarFila(key: string, campo: keyof Fila, valor: string) {
    setFilas((prev) =>
      prev.map((f) => (f.key === key ? { ...f, [campo]: valor } : f))
    );
  }

  function resetForm() {
    setClienteId("");
    setFilas([filaVacia()]);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await actionCrearCotizacion({
        cliente_id: clienteId,
        productos: filas.map((f) => ({
          nombre: f.nombre,
          cantidad: f.cantidad,
          precio_unitario: f.precio_unitario,
        })),
      });

      if (result.data) {
        toast.success("Cotización creada.");
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
            Nueva cotización
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva cotización</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Select
              value={clienteId}
              onValueChange={(value) => setClienteId(value ?? "")}
            >
              <SelectTrigger id="cliente" className="w-full">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    Primero agrega un cliente en la pestaña Clientes.
                  </div>
                )}
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Productos</Label>
            <div className="flex flex-col gap-2">
              {filas.map((fila) => (
                <div key={fila.key} className="flex items-center gap-2">
                  <Input
                    value={fila.nombre}
                    onChange={(e) =>
                      actualizarFila(fila.key, "nombre", e.target.value)
                    }
                    placeholder="Colchón Doble"
                    className="flex-1"
                  />
                  <Input
                    value={fila.cantidad}
                    onChange={(e) =>
                      actualizarFila(fila.key, "cantidad", e.target.value)
                    }
                    type="number"
                    min="1"
                    placeholder="Cant."
                    className="w-16"
                  />
                  <Input
                    value={fila.precio_unitario}
                    onChange={(e) =>
                      actualizarFila(fila.key, "precio_unitario", e.target.value)
                    }
                    type="number"
                    min="0"
                    placeholder="Precio"
                    className="w-28"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={filas.length === 1}
                    onClick={() =>
                      setFilas((prev) => prev.filter((f) => f.key !== fila.key))
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit gap-1.5"
              onClick={() => setFilas((prev) => [...prev, filaVacia()])}
            >
              <Plus className="size-3.5" />
              Agregar producto
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-[#1A1A1A] px-4 py-3">
            <span className="text-sm text-[#888]">Total</span>
            <span className="text-lg font-bold text-primary">
              {formatMoneda(total)}
            </span>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending || !clienteId}>
              {pending ? "Creando..." : "Crear cotización"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
