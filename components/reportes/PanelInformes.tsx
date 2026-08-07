import Link from "next/link";
import type { ClienteConEtapa } from "@/lib/types";
import type { PedidoReporte } from "@/lib/data/reportes";
import {
  contarNuevosEnPeriodo,
  clientesPorOrigen,
  clientesPorEtapaActual,
  serieDiaria,
  PERIODOS,
  type Periodo,
} from "@/lib/services/reportes.service";
import { BarraComparativa } from "@/components/charts/BarraComparativa";
import { Sparkline } from "@/components/charts/Sparkline";
import { Donut } from "@/components/charts/Donut";
import { TarjetaInforme } from "./TarjetaInforme";

export function PanelInformes({
  clientes,
  pedidos,
  dias,
}: {
  clientes: ClienteConEtapa[];
  pedidos: PedidoReporte[];
  dias: Periodo;
}) {
  const { actual, cambioPct } = contarNuevosEnPeriodo(
    clientes.map((c) => c.created_at),
    dias
  );
  const origenes = clientesPorOrigen(clientes);
  const etapas = clientesPorEtapaActual(clientes);
  const serieClientes = serieDiaria(
    clientes.map((c) => c.created_at),
    dias
  );
  const seriePedidos = serieDiaria(
    pedidos.map((p) => p.created_at),
    dias
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-white">
            Panel de informes
          </h1>
          <p className="mt-0.5 text-[13px] text-[#444]">
            Vista general de clientes y ventas
          </p>
        </div>
        <div className="flex gap-0.5 rounded-lg border border-border bg-card p-1">
          {PERIODOS.map((p) => (
            <Link
              key={p}
              href={`/reportes?periodo=${p}`}
              className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                dias === p
                  ? "bg-[#222] text-[#F0F0F0]"
                  : "text-[#444] hover:text-[#888]"
              }`}
            >
              {p} días
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TarjetaInforme
          titulo="Clientes nuevos"
          subtitulo={`En los últimos ${dias} días`}
        >
          <div className="flex items-end gap-3">
            <span className="text-[40px] leading-none font-extrabold text-white">
              {actual}
            </span>
            {cambioPct !== null && (
              <span
                className={`mb-1 text-sm font-semibold ${
                  cambioPct >= 0 ? "text-brand-lime" : "text-destructive"
                }`}
              >
                {cambioPct >= 0 ? "+" : ""}
                {cambioPct}% vs. período anterior
              </span>
            )}
          </div>
        </TarjetaInforme>

        <TarjetaInforme
          titulo="Fuentes de clientes"
          subtitulo="Origen de todos los clientes registrados"
        >
          <BarraComparativa datos={origenes} />
        </TarjetaInforme>

        <TarjetaInforme
          titulo="Clientes añadidos con el tiempo"
          subtitulo={`Diario · últimos ${dias} días`}
        >
          <Sparkline datos={serieClientes} color="var(--primary)" />
        </TarjetaInforme>

        <TarjetaInforme
          titulo="Pedidos con el tiempo"
          subtitulo={`Diario · últimos ${dias} días`}
        >
          <Sparkline datos={seriePedidos} color="var(--brand-lime)" />
        </TarjetaInforme>

        <TarjetaInforme
          titulo="Clientes por etapa"
          subtitulo="Distribución actual del pipeline"
          className="lg:col-span-2"
        >
          <Donut segmentos={etapas} />
        </TarjetaInforme>
      </div>
    </div>
  );
}
