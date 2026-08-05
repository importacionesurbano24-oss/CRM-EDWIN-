import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createServiceClient } from "@/lib/supabase/service";
import {
  getCotizacionPorToken,
  marcarVistaSiCorresponde,
} from "@/lib/data/cotizaciones";
import { formatMoneda } from "@/lib/ui/cotizacion";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const cotizacion = await getCotizacionPorToken(createServiceClient(), token);

  return {
    title: cotizacion
      ? `Cotización para ${cotizacion.clienteNombre} — Dormiluna`
      : "Cotización — Dormiluna",
  };
}

export default async function CotizacionPublicaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const service = createServiceClient();
  const cotizacion = await getCotizacionPorToken(service, token);

  if (!cotizacion) notFound();

  await marcarVistaSiCorresponde(service, cotizacion);

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 14L9 4L15 14H3Z" fill="#0A0A0A" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white">
              Dormiluna
            </div>
            <div className="text-[10px] tracking-wider text-[#444] uppercase">
              Cotización
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-6">
            <div className="text-xs text-[#555]">Cotización para</div>
            <div className="text-lg font-semibold text-white">
              {cotizacion.clienteNombre}
            </div>
            <div className="mt-0.5 text-xs text-[#444]">
              {format(new Date(cotizacion.created_at), "d 'de' MMMM, yyyy", {
                locale: es,
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            {cotizacion.productos.map((producto, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-[#F0F0F0]">
                    {producto.nombre}
                  </div>
                  <div className="text-xs text-[#555]">
                    {producto.cantidad} ×{" "}
                    {formatMoneda(producto.precio_unitario)}
                  </div>
                </div>
                <div className="shrink-0 text-sm font-medium text-[#D0D0D0]">
                  {formatMoneda(producto.cantidad * producto.precio_unitario)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm font-semibold text-[#888]">Total</span>
            <span className="text-2xl font-extrabold text-primary">
              {formatMoneda(cotizacion.monto_total)}
            </span>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-[#444]">
          ¿Preguntas sobre esta cotización? Escríbenos por WhatsApp.
        </p>
      </div>
    </div>
  );
}
