// Cálculos puros para /reportes — sin I/O, reciben los datos ya cargados
// desde Supabase y devuelven la forma lista para graficar. Ver
// docs/superpowers/specs/... (auditoría de /reportes) para qué métrica
// sale de qué tabla y por qué "Ventas por vendedor" no está acá (el CRM es
// de un solo usuario, no hay modelo multi-vendedor en el esquema).

import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { es } from "date-fns/locale";
import type { ClienteConEtapa, Etapa, Origen } from "@/lib/types";
import type { AlertaBriefing } from "@/lib/services/briefing.service";
import { ETAPA_META, ETAPA_ORDEN } from "@/lib/ui/etapa";
import { NOTA_LEAD_AUTOMATICO_WHATSAPP } from "@/lib/whatsapp/constantes";

/** Seguimiento completo (todas las filas, no solo la más reciente por cliente) — ver getTodosLosSeguimientos. */
export interface SeguimientoCompleto {
  cliente_id: string;
  etapa: Etapa;
  created_at: string;
  notas: string | null;
}

// ————————————————————————————————————————————————————————————
// Período (Hoy / 7 / 30 / 90 / personalizado)
// ————————————————————————————————————————————————————————————

export type PeriodoPreset = "hoy" | "7" | "30" | "90";

export const PERIODO_PRESETS: { valor: PeriodoPreset; label: string; dias: number }[] = [
  { valor: "hoy", label: "Hoy", dias: 1 },
  { valor: "7", label: "7 días", dias: 7 },
  { valor: "30", label: "30 días", dias: 30 },
  { valor: "90", label: "90 días", dias: 90 },
];

export interface RangoPeriodo {
  desde: Date;
  hasta: Date;
  /** true si viene de desde/hasta explícitos (filtro "Personalizado"), no de un preset. */
  esPersonalizado: boolean;
}

/** Arma el rango a partir del preset (?periodo=) o de fechas explícitas (?desde=&hasta=). */
export function resolverRangoPeriodo(
  periodo: string | undefined,
  desdeQuery: string | undefined,
  hastaQuery: string | undefined
): RangoPeriodo {
  if (desdeQuery && hastaQuery) {
    const desde = startOfDay(parseISO(desdeQuery));
    const hasta = endOfDay(parseISO(hastaQuery));
    if (!Number.isNaN(desde.getTime()) && !Number.isNaN(hasta.getTime()) && hasta >= desde) {
      return { desde, hasta, esPersonalizado: true };
    }
  }
  const preset = PERIODO_PRESETS.find((p) => p.valor === periodo) ?? PERIODO_PRESETS[2];
  return {
    desde: startOfDay(subDays(new Date(), preset.dias - 1)),
    hasta: endOfDay(new Date()),
    esPersonalizado: false,
  };
}

function rangoAnterior(rango: RangoPeriodo): RangoPeriodo {
  const dias = differenceInCalendarDays(rango.hasta, rango.desde) + 1;
  return {
    desde: startOfDay(subDays(rango.desde, dias)),
    hasta: endOfDay(subDays(rango.desde, 1)),
    esPersonalizado: rango.esPersonalizado,
  };
}

function dentroDe(fechaIso: string, rango: RangoPeriodo): boolean {
  const fecha = new Date(fechaIso);
  return fecha >= rango.desde && fecha <= rango.hasta;
}

export interface ComparativaPeriodo {
  actual: number;
  anterior: number;
  cambioPct: number | null;
}

/** Cuenta fechas dentro del rango vs. el mismo tramo inmediatamente anterior. */
export function contarConAnterior(fechas: string[], rango: RangoPeriodo): ComparativaPeriodo {
  const anterior = rangoAnterior(rango);
  const actual = fechas.filter((f) => dentroDe(f, rango)).length;
  const previo = fechas.filter((f) => dentroDe(f, anterior)).length;
  return {
    actual,
    anterior: previo,
    cambioPct: previo === 0 ? null : Math.round(((actual - previo) / previo) * 100),
  };
}

/** Igual que contarConAnterior pero sumando `monto` en vez de contar filas — para Ventas del período. */
export function sumarConAnterior(
  items: { fecha: string; monto: number }[],
  rango: RangoPeriodo
): ComparativaPeriodo {
  const anterior = rangoAnterior(rango);
  const suma = (r: RangoPeriodo) =>
    items.filter((i) => dentroDe(i.fecha, r)).reduce((acc, i) => acc + i.monto, 0);
  const actual = suma(rango);
  const previo = suma(anterior);
  return {
    actual,
    anterior: previo,
    cambioPct: previo === 0 ? null : Math.round(((actual - previo) / previo) * 100),
  };
}

export interface PuntoSerie {
  label: string;
  value: number;
}

/** Suma diaria de `monto` dentro del rango — para el sparkline bajo "Ventas del período". */
export function serieDiariaMonto(
  items: { fecha: string; monto: number }[],
  rango: RangoPeriodo
): PuntoSerie[] {
  const dias = eachDayOfInterval({ start: rango.desde, end: rango.hasta });
  return dias.map((dia) => ({
    label: format(dia, "d MMM", { locale: es }),
    value: items
      .filter((i) => isSameDay(new Date(i.fecha), dia))
      .reduce((acc, i) => acc + i.monto, 0),
  }));
}

// ————————————————————————————————————————————————————————————
// Origen de clientes (sin cambios de comportamiento — todo el histórico,
// no filtrado por período, igual que antes)
// ————————————————————————————————————————————————————————————

export const ORIGEN_META: Record<Origen, { label: string; color: string }> = {
  "walk-in": { label: "Llegó a la tienda", color: "var(--chart-1)" },
  referido: { label: "Referido", color: "var(--chart-2)" },
  otro: { label: "Otro", color: "var(--chart-3)" },
};

export interface Barra {
  label: string;
  value: number;
  color: string;
}

/** Distribución de clientes por su etapa ACTUAL (no acumulativo) — la usa construirContextoNegocio (chat de negocio) para contexto rápido de la IA. Para el embudo con caída real, ver embudoVentas más abajo. */
export function clientesPorEtapaActual(clientes: ClienteConEtapa[]): Barra[] {
  return ETAPA_ORDEN.map((etapa) => ({
    label: ETAPA_META[etapa].label,
    color: ETAPA_META[etapa].color,
    value: clientes.filter((c) => (c.etapa ?? "prospecto") === etapa).length,
  }));
}

/** Compat con construirContextoNegocio (chat de negocio): mismo cálculo que contarConAnterior, armando el RangoPeriodo a partir de `dias` en vez de recibirlo ya armado. */
export function contarNuevosEnPeriodo(fechas: string[], dias: number): ComparativaPeriodo {
  const hasta = endOfDay(new Date());
  const desde = startOfDay(subDays(new Date(), dias - 1));
  return contarConAnterior(fechas, { desde, hasta, esPersonalizado: false });
}

export function clientesPorOrigen(clientes: ClienteConEtapa[]): Barra[] {
  return (Object.keys(ORIGEN_META) as Origen[]).map((origen) => ({
    label: ORIGEN_META[origen].label,
    color: ORIGEN_META[origen].color,
    value: clientes.filter((c) => c.origen === origen).length,
  }));
}

// ————————————————————————————————————————————————————————————
// Valor del pipeline — cotizaciones abiertas (ni aceptadas ni vencidas)
// ————————————————————————————————————————————————————————————

export function valorPipeline(
  cotizaciones: { monto_total: number; estado: string }[]
): number {
  return cotizaciones
    .filter((c) => c.estado === "enviada" || c.estado === "vista")
    .reduce((acc, c) => acc + c.monto_total, 0);
}

// ————————————————————————————————————————————————————————————
// Tasa de conversión y embudo — ambos parten de "hasta qué etapa llegó
// cada cliente alguna vez", no de la etapa actual (un cliente en posventa
// ya pasó por cotizó y compró, y debe contar en esas etapas también).
// ————————————————————————————————————————————————————————————

function indiceMaximoPorCliente(seguimientos: SeguimientoCompleto[]): Map<string, number> {
  const indice = new Map<string, number>();
  for (const s of seguimientos) {
    const pos = ETAPA_ORDEN.indexOf(s.etapa);
    if (pos === -1) continue;
    const actual = indice.get(s.cliente_id) ?? -1;
    if (pos > actual) indice.set(s.cliente_id, pos);
  }
  return indice;
}

/** % de clientes que llegaron a cotizar y que además llegaron a comprar (o más allá). Histórico completo, no filtrado por período: una muestra por semana suele ser demasiado chica para ser representativa. */
export function tasaConversion(seguimientos: SeguimientoCompleto[]): number | null {
  const indice = indiceMaximoPorCliente(seguimientos);
  const idxCotizo = ETAPA_ORDEN.indexOf("cotizo");
  const idxCompro = ETAPA_ORDEN.indexOf("compro");

  let oportunidades = 0;
  let cerradas = 0;
  for (const maxIdx of indice.values()) {
    if (maxIdx < idxCotizo) continue;
    oportunidades += 1;
    if (maxIdx >= idxCompro) cerradas += 1;
  }
  return oportunidades === 0 ? null : Math.round((cerradas / oportunidades) * 100);
}

export interface EtapaEmbudo {
  etapa: Etapa;
  label: string;
  color: string;
  cantidad: number;
  valor: number;
}

/** Embudo acumulativo: cuántos clientes llegaron AL MENOS a cada etapa, y el valor cotizado asociado a esos clientes. Histórico completo (mismo criterio que Origen y que la vista anterior "Clientes por etapa"). `cotizacionesPorCliente` sale de sumarCotizacionesPorCliente. */
export function embudoVentas(
  seguimientos: SeguimientoCompleto[],
  cotizacionesPorCliente: Map<string, number>
): EtapaEmbudo[] {
  const indice = indiceMaximoPorCliente(seguimientos);

  return ETAPA_ORDEN.map((etapa, i) => {
    let cantidad = 0;
    let valor = 0;
    for (const [clienteId, maxIdx] of indice.entries()) {
      if (maxIdx < i) continue;
      cantidad += 1;
      valor += cotizacionesPorCliente.get(clienteId) ?? 0;
    }
    return { etapa, label: ETAPA_META[etapa].label, color: ETAPA_META[etapa].color, cantidad, valor };
  });
}

/** Suma de monto_total por cliente — insumo de embudoVentas, separado para no recalcularlo por etapa. */
export function sumarCotizacionesPorCliente(
  cotizaciones: { cliente_id: string; monto_total: number }[]
): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const c of cotizaciones) {
    mapa.set(c.cliente_id, (mapa.get(c.cliente_id) ?? 0) + c.monto_total);
  }
  return mapa;
}

// ————————————————————————————————————————————————————————————
// Tiempo promedio de cierre — desde el primer seguimiento del cliente
// (proxy razonable de "creación de la oportunidad": no hay una fecha de
// apertura separada en el esquema) hasta el primer seguimiento en 'compro'.
// ————————————————————————————————————————————————————————————

export function tiempoPromedioCierre(seguimientos: SeguimientoCompleto[]): number | null {
  const porCliente = new Map<string, SeguimientoCompleto[]>();
  for (const s of seguimientos) {
    const lista = porCliente.get(s.cliente_id) ?? [];
    lista.push(s);
    porCliente.set(s.cliente_id, lista);
  }

  const diasPorCierre: number[] = [];
  for (const lista of porCliente.values()) {
    const ordenada = [...lista].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const primero = ordenada[0];
    const primerCierre = ordenada.find((s) => s.etapa === "compro");
    if (!primero || !primerCierre) continue;
    const dias = differenceInCalendarDays(
      new Date(primerCierre.created_at),
      new Date(primero.created_at)
    );
    if (dias >= 0) diasPorCierre.push(dias);
  }

  if (diasPorCierre.length === 0) return null;
  const suma = diasPorCierre.reduce((acc, d) => acc + d, 0);
  return Math.round(suma / diasPorCierre.length);
}

// ————————————————————————————————————————————————————————————
// Rendimiento del agente IA — solo proxies con datos reales. NO incluye
// "ventas atribuidas al agente en $": no existe ningún vínculo causal
// entre un pedido y una acción de IA en el esquema actual.
// ————————————————————————————————————————————————————————————

export interface RendimientoAgenteIA {
  mensajesGenerados: number;
  leadsAutoCreados: number;
  /** % de TODOS los leads auto-creados históricamente que llegaron a comprar — no solo los del período, para no medir contra una muestra recién creada que aún no tuvo tiempo de convertir. */
  tasaConversionLeads: number | null;
}

export function rendimientoAgenteIA(
  mensajes: { direccion: string; generado_por_agente: boolean; created_at: string }[],
  seguimientos: SeguimientoCompleto[],
  rango: RangoPeriodo
): RendimientoAgenteIA {
  const mensajesGenerados = mensajes.filter(
    (m) => m.direccion === "saliente" && m.generado_por_agente && dentroDe(m.created_at, rango)
  ).length;

  const porCliente = new Map<string, SeguimientoCompleto[]>();
  for (const s of seguimientos) {
    const lista = porCliente.get(s.cliente_id) ?? [];
    lista.push(s);
    porCliente.set(s.cliente_id, lista);
  }

  // Primer seguimiento real de cada cliente (ordenado explícitamente acá —
  // no asume que `seguimientos` ya viene ordenado por fecha).
  const primeroPorCliente = new Map<string, SeguimientoCompleto>();
  for (const [clienteId, lista] of porCliente.entries()) {
    const [primero] = [...lista].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    if (primero) primeroPorCliente.set(clienteId, primero);
  }

  const leadsAutomaticos = [...primeroPorCliente.entries()]
    .filter(([, primero]) => primero.notas === NOTA_LEAD_AUTOMATICO_WHATSAPP)
    .map(([clienteId]) => clienteId);

  const leadsAutoCreados = leadsAutomaticos.filter((clienteId) => {
    const primero = primeroPorCliente.get(clienteId);
    return primero && dentroDe(primero.created_at, rango);
  }).length;

  const indice = indiceMaximoPorCliente(seguimientos);
  const idxCompro = ETAPA_ORDEN.indexOf("compro");
  const convertidos = leadsAutomaticos.filter((id) => (indice.get(id) ?? -1) >= idxCompro).length;
  const tasaConversionLeads =
    leadsAutomaticos.length === 0 ? null : Math.round((convertidos / leadsAutomaticos.length) * 100);

  return { mensajesGenerados, leadsAutoCreados, tasaConversionLeads };
}
