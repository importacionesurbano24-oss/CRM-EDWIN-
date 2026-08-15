"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { actionEjecutarAlertaBriefing } from "@/app/actions/briefing.actions";
import { textoPlantilla } from "@/lib/services/briefing.service";
import type { EnfoqueItem } from "@/lib/services/enfoque.service";
import { ETAPA_META } from "@/lib/ui/etapa";
import { Button } from "@/components/ui/button";

export function ItemBriefingEnfoque({
  item,
  vistosArray,
  total,
}: {
  item: Extract<EnfoqueItem, { tipo: "briefing" }>;
  vistosArray: string[];
  total: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { alerta } = item;
  const { situacion, accionSugerida } = textoPlantilla(alerta);

  function siguientePaso() {
    const nuevosVistos = [...vistosArray, item.taskKey];
    router.push(`/enfoque?vistos=${nuevosVistos.join(",")}&total=${total}`);
  }

  function ejecutar() {
    startTransition(async () => {
      const result = await actionEjecutarAlertaBriefing(alerta);
      if (!result.data) {
        toast.error(result.error);
        return;
      }
      toast.success(`Seguimiento registrado para ${alerta.clienteNombre}.`);
      siguientePaso();
    });
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-4 rounded-[14px] border border-border bg-card p-6">
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[#F0F0F0]">
            {alerta.clienteNombre}
          </span>
          {alerta.etapaSugerida && (
            <span className="text-[11px] text-[#555]">
              {ETAPA_META[alerta.etapaActual].label} →{" "}
              {ETAPA_META[alerta.etapaSugerida].label}
            </span>
          )}
        </div>
        <p className="text-[13px] text-[#888]">{situacion}</p>
        <p className="mt-0.5 text-[13px] text-[#D0D0D0]">{accionSugerida}</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={ejecutar} className="gap-1.5">
          <Check className="size-3.5" />
          {pending ? "..." : "Ejecutar"}
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={siguientePaso}>
          <X className="size-3.5" />
          Ignorar
        </Button>
      </div>
    </div>
  );
}
