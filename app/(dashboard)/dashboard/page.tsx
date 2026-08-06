import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import {
  getClientesConEtapa,
  getActividadReciente,
  getTodosLosSeguimientos,
  clientesQueAlcanzaron,
} from "@/lib/data/clientes";
import { getCotizaciones } from "@/lib/data/cotizaciones";
import { ETAPA_META, ETAPA_ORDEN } from "@/lib/ui/etapa";
import { calcularUrgencia, esPendienteHoy } from "@/lib/ui/urgencia";
import { estadoEfectivo } from "@/lib/ui/cotizacion";
import { ClienteAvatar } from "@/components/pipeline/ClienteAvatar";
import { EtapaBadge } from "@/components/pipeline/EtapaBadge";
import { NuevoClienteDialog } from "@/components/pipeline/NuevoClienteDialog";

function nombrePorDia() {
  const hoy = new Date();
  const dias = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  return `${dias[hoy.getDay()]} ${hoy.getDate()} de ${meses[hoy.getMonth()]}, ${hoy.getFullYear()}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [clientes, actividad, cotizaciones, seguimientos] = await Promise.all([
    getClientesConEtapa(supabase),
    getActividadReciente(supabase, 5),
    getCotizaciones(supabase),
    getTodosLosSeguimientos(supabase),
  ]);

  const nombreSaludo = user?.email?.split("@")[0] ?? "";

  const tareasHoy = clientes
    .filter((c) => esPendienteHoy(c.proxima_accion_fecha))
    .slice(0, 6);

  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - 7);

  const contarEtapa = (etapa: string) =>
    clientes.filter((c) => c.etapa === etapa).length;

  const nuevosEstaSemana = clientes.filter(
    (c) => new Date(c.created_at) >= inicioSemana
  ).length;

  const kpis = [
    {
      label: "Prospectos activos",
      value: contarEtapa("prospecto"),
      sub: `+${nuevosEstaSemana} esta semana`,
      color: "#F0F0F0",
    },
    {
      label: "Cotizaciones abiertas",
      value: cotizaciones.filter((c) => {
        const estado = estadoEfectivo(c);
        return estado === "enviada" || estado === "vista";
      }).length,
      sub: "esperando respuesta",
      color: ETAPA_META.cotizo.color,
    },
    {
      label: "Clientes que compraron",
      value: clientesQueAlcanzaron(seguimientos, [
        "compro",
        "posventa",
        "referido_solicitado",
      ]),
      sub: "alguna vez",
      color: ETAPA_META.compro.color,
    },
    {
      label: "Referidos pedidos",
      value: clientesQueAlcanzaron(seguimientos, ["referido_solicitado"]),
      sub: "alguna vez",
      color: ETAPA_META.referido_solicitado.color,
    },
  ];

  const totalPipeline = clientes.length || 1;
  const pipeline = ETAPA_ORDEN.map((etapa) => {
    const count = contarEtapa(etapa);
    return {
      etapa,
      label: ETAPA_META[etapa].label,
      color: ETAPA_META[etapa].color,
      count,
      pct: Math.round((count / totalPipeline) * 100),
    };
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-9 md:py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 text-[11px] tracking-wide text-[#444] uppercase">
            {nombrePorDia()}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-[28px]">
            {nombreSaludo ? `Buenos días, ${nombreSaludo} 👋` : "Buenos días 👋"}
          </h1>
          <p className="mt-1 text-sm text-[#555]">
            Tienes{" "}
            <span className="font-semibold text-primary">
              {tareasHoy.length}
            </span>{" "}
            seguimientos pendientes para hoy.
          </p>
        </div>
        <NuevoClienteDialog />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[14px] border border-border bg-card p-5"
          >
            <div className="mb-3 text-[11px] tracking-wide text-[#444] uppercase">
              {kpi.label}
            </div>
            <div
              className="text-[32px] leading-none font-extrabold tracking-tight"
              style={{ color: kpi.color }}
            >
              {kpi.value}
            </div>
            <div className="mt-1.5 text-xs text-[#444]">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold tracking-wide text-[#888] uppercase">
              Hoy toca
            </h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {tareasHoy.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-[#555]">
                No hay seguimientos pendientes para hoy.
              </div>
            )}
            {tareasHoy.map((tarea) => {
              const urgencia = calcularUrgencia(tarea.proxima_accion_fecha);
              return (
                <Link
                  key={tarea.id}
                  href={`/clientes/${tarea.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card px-4.5 py-4 transition-colors hover:border-primary"
                >
                  <ClienteAvatar id={tarea.id} nombre={tarea.nombre} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[#F0F0F0]">
                      {tarea.nombre}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-[#555]">
                      {tarea.proxima_accion || "Seguimiento pendiente"}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <EtapaBadge etapa={tarea.etapa} />
                    <div
                      className="mt-1 text-[11px] font-medium"
                      style={{ color: urgencia.color }}
                    >
                      {urgencia.label}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-[14px] border border-border bg-card p-5">
            <div className="mb-4 text-xs font-semibold tracking-wide text-[#555] uppercase">
              Actividad reciente
            </div>
            <div className="flex flex-col gap-3.5">
              {actividad.length === 0 && (
                <p className="text-xs text-[#444]">Sin actividad todavía.</p>
              )}
              {actividad.map((act) => (
                <div key={act.id} className="flex gap-3">
                  <div className="relative w-0.5 shrink-0 rounded-sm bg-[#1E1E1E]">
                    <div
                      className="absolute top-0.5 -left-[3px] h-2 w-2 rounded-full"
                      style={{ background: ETAPA_META[act.etapa].color }}
                    />
                  </div>
                  <div className="pb-0.5">
                    <div className="text-[13px] text-[#D0D0D0]">
                      <Link
                        href={`/clientes/${act.clienteId}`}
                        className="font-medium hover:text-primary"
                      >
                        {act.clienteNombre}
                      </Link>{" "}
                      pasó a {ETAPA_META[act.etapa].label.toLowerCase()}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#444]">
                      {formatDistanceToNowStrict(new Date(act.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[14px] border border-border bg-card p-5">
            <div className="mb-4 text-xs font-semibold tracking-wide text-[#555] uppercase">
              Pipeline
            </div>
            <div className="flex flex-col gap-2.5">
              {pipeline.map((etapa) => (
                <div key={etapa.etapa} className="flex items-center gap-2.5">
                  <div className="w-[110px] shrink-0 text-xs text-[#555]">
                    {etapa.label}
                  </div>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1A1A1A]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${etapa.pct}%`,
                        background: etapa.color,
                      }}
                    />
                  </div>
                  <div className="w-5 shrink-0 text-right text-[13px] font-semibold text-[#888]">
                    {etapa.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
