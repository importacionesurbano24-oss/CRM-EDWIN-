"use client";

import { useState, type ReactNode } from "react";
import {
  AGENTE_ORO as ORO,
  AGENTE_BORDE as BORDE,
  AGENTE_TEXTO as TEXTO,
  AGENTE_TEXTO_MUTED as TEXTO_MUTED,
} from "@/lib/ui/agente-theme";

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
      <div className="mt-8 mb-0 flex gap-8" style={{ borderBottom: `1px solid ${BORDE}` }}>
        {TABS.map(({ valor, label }) => (
          <button
            key={valor}
            type="button"
            onClick={() => setTab(valor)}
            className="-mb-px pb-4 text-[15px] tracking-[-0.01em] transition-colors"
            style={{
              fontWeight: tab === valor ? 700 : 500,
              color: tab === valor ? TEXTO : TEXTO_MUTED,
              borderBottom: `2px solid ${tab === valor ? ORO : "transparent"}`,
            }}
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
