"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import type { ClienteConEtapa, Etapa } from "@/lib/types";
import { ETAPA_META } from "@/lib/ui/etapa";
import { EtapasGrid } from "./EtapasGrid";
import { ListaClientes } from "./ListaClientes";
import { NuevoClienteDialog } from "./NuevoClienteDialog";
import { FiltroFecha } from "./FiltroFecha";

export function ClientesView({
  clientes,
  filtroEtapas = [],
}: {
  clientes: ClienteConEtapa[];
  filtroEtapas?: Etapa[];
}) {
  const hayFiltro = filtroEtapas.length > 0;
  const [vista, setVista] = useState<"etapas" | "lista">(
    hayFiltro ? "lista" : "etapas"
  );

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hrefSinEtapa = (() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("etapa");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  })();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-4 border-b border-border px-4 pt-5 pb-5 sm:flex-row sm:items-center sm:justify-between md:px-9 md:pt-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white md:text-[22px]">
            Clientes &amp; Pipeline
          </h1>
          <p className="mt-0.5 text-[13px] text-[#444]">
            {clientes.length} clientes{" "}
            {hayFiltro ? "en este filtro" : "activos en seguimiento"}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-0.5 rounded-lg border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setVista("etapas")}
              className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                vista === "etapas"
                  ? "bg-[#222] text-[#F0F0F0]"
                  : "text-[#444] hover:text-[#888]"
              }`}
            >
              Etapas
            </button>
            <button
              type="button"
              onClick={() => setVista("lista")}
              className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                vista === "lista"
                  ? "bg-[#222] text-[#F0F0F0]"
                  : "text-[#444] hover:text-[#888]"
              }`}
            >
              Lista
            </button>
          </div>
          <NuevoClienteDialog />
        </div>
      </div>

      <div className="pt-4">
        <FiltroFecha />
      </div>

      {hayFiltro && (
        <div className="px-4 pt-3 md:px-9">
          <Link
            href={hrefSinEtapa}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            Filtro:{" "}
            {filtroEtapas.map((e) => ETAPA_META[e].label).join(" + ")}
            <X className="size-3.5" />
          </Link>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden pt-5">
        {vista === "etapas" ? (
          <EtapasGrid clientes={clientes} />
        ) : (
          <ListaClientes clientes={clientes} />
        )}
      </div>
    </div>
  );
}
