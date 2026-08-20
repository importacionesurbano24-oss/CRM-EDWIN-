"use client";

import { useState, type ReactNode } from "react";

const TABS = [
  { valor: "conocimiento", label: "Conocimiento" },
  { valor: "entrenamiento", label: "Entrenamiento" },
] as const;

type Tab = (typeof TABS)[number]["valor"];

/**
 * Alterna visibilidad con block/hidden en vez de desmontar la pestaña
 * inactiva — así ediciones sin guardar (el textarea de Conocimiento, una
 * conversación de prueba en Entrenamiento) no se pierden al cambiar de
 * pestaña.
 */
export function AgenteTabs({
  conocimiento,
  entrenamiento,
}: {
  conocimiento: ReactNode;
  entrenamiento: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("conocimiento");

  return (
    <div>
      <div className="mb-6 flex gap-6 border-b border-border">
        {TABS.map(({ valor, label }) => (
          <button
            key={valor}
            type="button"
            onClick={() => setTab(valor)}
            className={`-mb-px border-b-2 pb-3 text-[14px] font-semibold transition-colors ${
              tab === valor
                ? "border-primary text-white"
                : "border-transparent text-[#666] hover:text-[#999]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={tab === "conocimiento" ? "block" : "hidden"}>{conocimiento}</div>
      <div className={tab === "entrenamiento" ? "block" : "hidden"}>{entrenamiento}</div>
    </div>
  );
}
