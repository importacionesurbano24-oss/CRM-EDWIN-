"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ClienteConEtapa } from "@/lib/types";
import { ETAPA_META, ETAPA_ORDEN } from "@/lib/ui/etapa";

export function EtapasGrid({ clientes }: { clientes: ClienteConEtapa[] }) {
  const searchParams = useSearchParams();

  function hrefParaEtapa(etapa: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("etapa", etapa);
    return `/clientes?${params.toString()}`;
  }

  return (
    <div className="grid grid-cols-2 gap-3 px-4 pb-6 md:grid-cols-5 md:gap-4 md:px-9">
      {ETAPA_ORDEN.map((etapa) => {
        const meta = ETAPA_META[etapa];
        const count = clientes.filter(
          (c) => (c.etapa ?? "prospecto") === etapa
        ).length;

        return (
          <Link
            key={etapa}
            href={hrefParaEtapa(etapa)}
            className="group rounded-[14px] border border-border bg-card p-5 transition-colors hover:border-[#2E2E2E]"
          >
            <div className="mb-3 flex items-center justify-between text-[11px] tracking-wide text-[#444] uppercase">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: meta.color }}
                />
                {meta.label}
              </span>
              <span className="opacity-0 transition-opacity group-hover:opacity-100">
                →
              </span>
            </div>
            <div
              className="text-[32px] leading-none font-extrabold tracking-tight"
              style={{ color: meta.color }}
            >
              {count}
            </div>
            <div className="mt-1.5 text-xs text-[#444]">
              {count === 1 ? "cliente" : "clientes"}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
