import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ClienteConEtapa } from "@/lib/types";
import type { PedidoReporte, CotizacionReporte, MensajeWhatsappReporte } from "@/lib/data/reportes";
import type { AlertaBriefing } from "@/lib/services/briefing.service";
import {
  PERIODO_PRESETS,
  clientesPorOrigen,
  contarConAnterior,
  embudoVentas,
  rendimientoAgenteIA,
  serieDiariaMonto,
  sumarCotizacionesPorCliente,
  sumarConAnterior,
  tasaConversion,
  tiempoPromedioCierre,
  valorPipeline,
  type PeriodoPreset,
  type RangoPeriodo,
  type SeguimientoCompleto,
} from "@/lib/services/reportes.service";
import { formatMoneda } from "@/lib/ui/cotizacion";
import { BarraComparativa } from "@/components/charts/BarraComparativa";
import { Sparkline } from "@/components/charts/Sparkline";
import { TarjetaInforme } from "@/components/reportes/TarjetaInforme";
import { TarjetaKpi } from "@/components/reportes/TarjetaKpi";
import { EmbudoVentas } from "@/components/reportes/EmbudoVentas";
import { OportunidadesSinSeguimiento } from "@/components/reportes/OportunidadesSinSeguimiento";
import { RendimientoAgenteIA } from "@/components/reportes/RendimientoAgenteIA";
import { FiltrosPeriodo } from "@/components/reportes/FiltrosPeriodo";

export function PanelInformes({
  clientes,
  pedidos,
  cotizaciones,
  seguimientos,
  mensajesWhatsapp,
  alertasBriefing,
  rango,
  periodo,
  desde,
  hasta,
}: {
  clientes: ClienteConEtapa[];
  pedidos: PedidoReporte[];
  cotizaciones: CotizacionReporte[];
  seguimientos: SeguimientoCompleto[];
  mensajesWhatsapp: MensajeWhatsappReporte[];
  alertasBriefing: AlertaBriefing[];
  rango: RangoPeriodo;
  periodo?: string;
  desde?: string;
  hasta?: string;
}) {
  const periodoActivo = (PERIODO_PRESETS.find((p) => p.valor === periodo)?.valor ??
    "30") as PeriodoPreset;

  const itemsPedidos = pedidos.map((p) => ({ fecha: p.fecha_compra, monto: p.monto }));
  const ventas = sumarConAnterior(itemsPedidos, rango);
  const serieVentas = serieDiariaMonto(itemsPedidos, rango);

  const pipeline = valorPipeline(cotizaciones);
  const conversion = tasaConversion(seguimientos);
  const tiempoCierre = tiempoPromedioCierre(seguimientos);

  const cotizacionesPorCliente = sumarCotizacionesPorCliente(cotizaciones);
  const embudo = embudoVentas(seguimientos, cotizacionesPorCliente);

  const rendimientoIA = rendimientoAgenteIA(mensajesWhatsapp, seguimientos, rango);

  const origenes = clientesPorOrigen(clientes);
  const clientesNuevos = contarConAnterior(
    clientes.map((c) => c.created_at),
    rango
  );

  const rangoLabel = rango.esPersonalizado
    ? `${format(rango.desde, "d MMM", { locale: es })} – ${format(rango.hasta, "d MMM", { locale: es })}`
    : PERIODO_PRESETS.find((p) => p.valor === periodoActivo)?.label ?? "30 días";

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-white">Reportes</h1>
          <p className="mt-0.5 text-[13px] text-[#444]">
            Centro de inteligencia comercial — {rangoLabel.toLowerCase()}
          </p>
        </div>
        <FiltrosPeriodo
          periodoActivo={periodoActivo}
          esPersonalizado={rango.esPersonalizado}
          desdeActual={desde}
          hastaActual={hasta}
        />
      </div>

      {/* KPIs principales */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaKpi
          titulo="Ventas del período"
          valor={formatMoneda(ventas.actual)}
          cambioPct={ventas.cambioPct}
        >
          <Sparkline datos={serieVentas} color="var(--brand-lime)" />
        </TarjetaKpi>

        <TarjetaKpi
          titulo="Valor del pipeline"
          valor={formatMoneda(pipeline)}
          subtitulo="Cotizaciones enviadas o vistas, sin cerrar todavía"
        />

        <TarjetaKpi
          titulo="Tasa de conversión"
          valor={conversion !== null ? `${conversion}%` : "—"}
          subtitulo="De quienes cotizaron, cuántos compraron — histórico"
        />

        <TarjetaKpi
          titulo="Tiempo promedio de cierre"
          valor={tiempoCierre !== null ? `${tiempoCierre} días` : "—"}
          subtitulo="Desde el primer contacto hasta la compra"
          invertirColor
        />
      </div>

      {/* Estratégicas */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TarjetaInforme
          titulo="Embudo de ventas"
          subtitulo="Clientes que llegaron al menos a cada etapa, con el valor cotizado asociado"
        >
          <EmbudoVentas etapas={embudo} />
        </TarjetaInforme>

        <TarjetaInforme
          titulo="Oportunidades sin seguimiento"
          subtitulo="Clientes que llevan demasiado tiempo sin contacto"
        >
          <OportunidadesSinSeguimiento alertas={alertasBriefing} />
        </TarjetaInforme>

        <TarjetaInforme
          titulo="Rendimiento del agente IA"
          subtitulo={`En ${rangoLabel.toLowerCase()}, salvo la conversión (histórica)`}
          className="lg:col-span-2"
        >
          <RendimientoAgenteIA rendimiento={rendimientoIA} />
        </TarjetaInforme>

        <TarjetaInforme
          titulo="Origen de clientes"
          subtitulo={`Todos los registrados · +${clientesNuevos.actual} en ${rangoLabel.toLowerCase()}`}
          className="lg:col-span-2"
        >
          <BarraComparativa datos={origenes} />
        </TarjetaInforme>
      </div>
    </div>
  );
}
