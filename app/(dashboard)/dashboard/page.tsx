import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import {
  getClientesConEtapa,
  getActividadReciente,
  getTodosLosSeguimientos,
  clientesQueAlcanzaron,
} from "@/lib/data/clientes";
import { ETAPA_META, ETAPA_ORDEN } from "@/lib/ui/etapa";
import { esPendienteHoy } from "@/lib/ui/urgencia";

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

  const [clientes, actividad, seguimientos] = await Promise.all([
    getClientesConEtapa(supabase),
    getActividadReciente(supabase, 5),
    getTodosLosSeguimientos(supabase),
  ]);

  const nombreSaludo = user?.email?.split("@")[0] ?? "";

  const tareasHoy = clientes.filter((c) => esPendienteHoy(c.proxima_accion_fecha));

  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - 7);

  const contarEtapa = (etapa: string) =>
    clientes.filter((c) => c.etapa === etapa).length;

  const nuevosEstaSemana = clientes.filter(
    (c) => new Date(c.created_at) >= inicioSemana
  ).length;

  const kpis: {
    label: string;
    value: number;
    sub: string;
    color: string;
    href: string;
  }[] = [
    {
      label: "Prospectos activos",
      value: contarEtapa("prospecto"),
      sub: `+${nuevosEstaSemana} esta semana`,
      color: "#F0F0F0",
      href: "/clientes?etapa=prospecto",
    },
    {
      label: "Cotizaciones abiertas",
      value: contarEtapa("cotizo"),
      sub: "clientes esperando respuesta",
      color: ETAPA_META.cotizo.color,
      href: "/clientes?etapa=cotizo",
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
      href: "/clientes?etapa=compro,posventa,referido_solicitado",
    },
    {
      label: "Referidos pedidos",
      value: clientesQueAlcanzaron(seguimientos, ["referido_solicitado"]),
      sub: "alguna vez",
      color: ETAPA_META.referido_solicitado.color,
      href: "/clientes?etapa=referido_solicitado",
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
        <Link
          href="/tareas"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Próxima tarea
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="group rounded-[14px] border border-border bg-card p-5 transition-colors hover:border-[#2E2E2E]"
          >
            <div className="mb-3 flex items-center justify-between text-[11px] tracking-wide text-[#444] uppercase">
              <span>{kpi.label}</span>
              <span className="opacity-0 transition-opacity group-hover:opacity-100">
                →
              </span>
            </div>
            <div
              className="text-[32px] leading-none font-extrabold tracking-tight"
              style={{ color: kpi.color }}
            >
              {kpi.value}
            </div>
            <div className="mt-1.5 text-xs text-[#444]">{kpi.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
  );
}
