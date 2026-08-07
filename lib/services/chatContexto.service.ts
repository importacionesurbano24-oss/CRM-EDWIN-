// Arma el bloque de contexto (texto plano) que reciben los dos chats de IA.
// El de cliente reutiliza el mismo formateo que ya usa "Sugerir" en
// lib/claude/agente.ts; el de negocio reutiliza los cálculos que ya arman
// el Panel de informes y el Briefing del día — nada nuevo, solo texto.

import type { ClienteConEtapa } from "@/lib/types";
import { formatearContexto, type ContextoCliente } from "@/lib/claude/agente";
import {
  contarNuevosEnPeriodo,
  clientesPorOrigen,
  clientesPorEtapaActual,
} from "@/lib/services/reportes.service";
import { generarAlertasBriefing } from "@/lib/services/briefing.service";
import type { PedidoReporte } from "@/lib/data/reportes";

export function construirContextoCliente(ctx: ContextoCliente): string {
  return formatearContexto(ctx);
}

export function construirContextoNegocio(
  clientes: ClienteConEtapa[],
  pedidos: PedidoReporte[]
): string {
  const lineas: string[] = [];

  const { actual } = contarNuevosEnPeriodo(
    clientes.map((c) => c.created_at),
    30
  );
  lineas.push(`Clientes nuevos en los últimos 30 días: ${actual}`);
  lineas.push(`Total de clientes registrados: ${clientes.length}`);

  lineas.push("");
  lineas.push("Clientes por origen:");
  for (const o of clientesPorOrigen(clientes)) {
    lineas.push(`- ${o.label}: ${o.value}`);
  }

  lineas.push("");
  lineas.push("Clientes por etapa actual del pipeline:");
  for (const e of clientesPorEtapaActual(clientes)) {
    lineas.push(`- ${e.label}: ${e.value}`);
  }

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const pedidosDelMes = pedidos.filter((p) => new Date(p.created_at) >= inicioMes);
  const totalVentasMes = pedidosDelMes.reduce((suma, p) => suma + p.monto, 0);
  lineas.push("");
  lineas.push(
    `Ventas de este mes: ${pedidosDelMes.length} pedidos, $${totalVentasMes.toLocaleString("es-CO")} en total.`
  );

  const alertas = generarAlertasBriefing(clientes);
  lineas.push("");
  lineas.push("Clientes que llevan tiempo sin acción o requieren seguimiento:");
  if (alertas.length === 0) {
    lineas.push("- Ninguno por ahora.");
  }
  for (const a of alertas.slice(0, 15)) {
    lineas.push(`- ${a.clienteNombre}: ${a.dias} días en ${a.etapaActual} (${a.regla})`);
  }

  return lineas.join("\n");
}
