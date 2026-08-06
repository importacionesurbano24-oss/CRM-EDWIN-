import Link from "next/link";
import type { ClienteConEtapa } from "@/lib/types";
import { calcularUrgencia } from "@/lib/ui/urgencia";
import { ClienteAvatar } from "./ClienteAvatar";
import { EtapaBadge } from "./EtapaBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ListaClientes({ clientes }: { clientes: ClienteConEtapa[] }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6 md:px-9">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Próxima acción</TableHead>
            <TableHead>Urgencia</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => {
            const urgencia = calcularUrgencia(cliente.proxima_accion_fecha);
            return (
              <TableRow key={cliente.id}>
                <TableCell>
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="flex items-center gap-2.5"
                  >
                    <ClienteAvatar id={cliente.id} nombre={cliente.nombre} />
                    <div>
                      <div className="text-sm font-medium text-[#F0F0F0]">
                        {cliente.nombre}
                      </div>
                      <div className="text-xs text-[#444]">
                        {cliente.telefono_whatsapp}
                      </div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <EtapaBadge etapa={cliente.etapa} />
                </TableCell>
                <TableCell className="max-w-[220px] truncate text-sm text-[#777]">
                  {cliente.proxima_accion || "—"}
                </TableCell>
                <TableCell
                  className="text-sm font-medium"
                  style={{ color: urgencia.color }}
                >
                  {urgencia.label}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="text-xs text-[#888] hover:text-foreground"
                  >
                    Ver →
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
          {clientes.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-10 text-center text-sm text-[#555]"
              >
                Todavía no hay clientes. Agrega el primero con &quot;Nuevo
                cliente&quot;.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
