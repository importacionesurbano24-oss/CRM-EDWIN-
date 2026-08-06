"use client";

import { useState } from "react";
import type { ClienteConEtapa } from "@/lib/types";
import { KanbanBoard } from "./KanbanBoard";
import { ListaClientes } from "./ListaClientes";
import { NuevoClienteDialog } from "./NuevoClienteDialog";

export function ClientesView({ clientes }: { clientes: ClienteConEtapa[] }) {
  const [vista, setVista] = useState<"kanban" | "lista">("kanban");

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-4 border-b border-border px-4 pt-5 pb-5 sm:flex-row sm:items-center sm:justify-between md:px-9 md:pt-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white md:text-[22px]">
            Clientes &amp; Pipeline
          </h1>
          <p className="mt-0.5 text-[13px] text-[#444]">
            {clientes.length} clientes activos en seguimiento
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-0.5 rounded-lg border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setVista("kanban")}
              className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                vista === "kanban"
                  ? "bg-[#222] text-[#F0F0F0]"
                  : "text-[#444] hover:text-[#888]"
              }`}
            >
              Kanban
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

      <div className="flex flex-1 flex-col overflow-hidden pt-5">
        {vista === "kanban" ? (
          <KanbanBoard clientes={clientes} />
        ) : (
          <ListaClientes clientes={clientes} />
        )}
      </div>
    </div>
  );
}
