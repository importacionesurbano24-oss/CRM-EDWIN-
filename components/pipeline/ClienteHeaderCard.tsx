import Link from "next/link";
import { Phone, Mail, Info, Wallet, Clock, History } from "lucide-react";
import type { ClienteConEtapa } from "@/lib/types";
import { ClienteAvatar } from "@/components/pipeline/ClienteAvatar";
import { EtapaBadge } from "@/components/pipeline/EtapaBadge";
import { BotonEnviarWhatsApp } from "@/components/clientes/BotonEnviarWhatsApp";
import { formatMoneda } from "@/lib/ui/cotizacion";

const ORIGEN_LABEL: Record<string, string> = {
  "walk-in": "Llegó a la tienda",
  referido: "Referido",
  otro: "Otro",
};

export function ClienteHeaderCard({
  cliente,
  montoCotizado,
  diasSinContacto,
  totalSeguimientos,
}: {
  cliente: ClienteConEtapa;
  /** Monto de la cotización más reciente, o null si nunca cotizó. */
  montoCotizado: number | null;
  /** Días desde el último seguimiento (o desde que se creó, si no tiene ninguno). */
  diasSinContacto: number;
  totalSeguimientos: number;
}) {
  return (
    <div className="mb-6 rounded-[14px] border border-border bg-card p-6 md:p-7">
      <div className="flex flex-wrap items-center gap-5">
        <ClienteAvatar id={cliente.id} nombre={cliente.nombre} size={68} />

        <div className="min-w-[200px] flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] font-bold tracking-tight text-white">
              {cliente.nombre}
            </h1>
            <EtapaBadge etapa={cliente.etapa} />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {cliente.telefono_whatsapp && (
              <span className="flex items-center gap-1.5 text-[13px] text-[#888]">
                <Phone className="size-3.5" />
                {cliente.telefono_whatsapp}
              </span>
            )}
            {cliente.email && (
              <>
                <span className="text-[#2A2A2A]">·</span>
                <span className="flex items-center gap-1.5 text-[13px] text-[#888]">
                  <Mail className="size-3.5" />
                  {cliente.email}
                </span>
              </>
            )}
            <span className="text-[#2A2A2A]">·</span>
            <span className="flex items-center gap-1.5 text-[13px] text-[#888]">
              <Info className="size-3.5" />
              {ORIGEN_LABEL[cliente.origen] ?? cliente.origen}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {montoCotizado !== null && (
            <div className="flex items-center gap-2 rounded-full border border-border bg-[#1A1A1A] px-3.5 py-1.5">
              <Wallet className="size-3.5 text-[#888]" />
              <div>
                <div className="text-[13px] font-bold text-primary">
                  {formatMoneda(montoCotizado)}
                </div>
                <div className="text-[10px] text-[#888]">cotizado</div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-full border border-[#3A1A1A] bg-[#1A1A1A] px-3.5 py-1.5">
            <Clock className="size-3.5 text-[#888]" />
            <div>
              <div className="text-[13px] font-bold text-destructive">
                {diasSinContacto} {diasSinContacto === 1 ? "día" : "días"}
              </div>
              <div className="text-[10px] text-[#888]">sin contacto</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-[#1A1A1A] px-3.5 py-1.5">
            <History className="size-3.5 text-[#888]" />
            <div>
              <div className="text-[13px] font-bold text-white">
                {totalSeguimientos}
              </div>
              <div className="text-[10px] text-[#888]">seguimientos</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2.5">
        <BotonEnviarWhatsApp
          clienteId={cliente.id}
          clienteNombre={cliente.nombre}
          telefono={cliente.telefono_whatsapp}
        />
        {cliente.telefono_whatsapp && (
          <a
            href={`tel:${cliente.telefono_whatsapp}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-[#1A1A1A] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#222]"
          >
            <Phone className="size-3.5" />
            Llamar
          </a>
        )}
        <Link
          href="#seguimiento"
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/60 bg-primary/10 px-4 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          Registrar seguimiento
        </Link>
      </div>
    </div>
  );
}
