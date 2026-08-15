"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Clock } from "lucide-react";
import { actionPosponerTarea } from "@/app/actions/enfoque.actions";
import type { EnfoqueItem } from "@/lib/services/enfoque.service";
import { ETAPA_META } from "@/lib/ui/etapa";
import { Button, buttonVariants } from "@/components/ui/button";

export function ItemHoyTocaEnfoque({
  item,
  vistosArray,
  total,
}: {
  item: Extract<EnfoqueItem, { tipo: "hoy_toca" }>;
  vistosArray: string[];
  total: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { cliente } = item;
  const vistosParam = vistosArray.join(",");

  function posponer() {
    startTransition(async () => {
      const result = await actionPosponerTarea(cliente.id, cliente.etapa);
      if (!result.data) {
        toast.error(result.error);
        return;
      }
      toast.success(`${cliente.nombre} pospuesto para mañana.`);
      router.push(`/enfoque?vistos=${vistosParam}&total=${total}`);
    });
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-4 rounded-[14px] border border-border bg-card p-6">
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[#F0F0F0]">
            {cliente.nombre}
          </span>
          {cliente.etapa && (
            <span className="text-[11px] text-[#555]">
              {ETAPA_META[cliente.etapa].label}
            </span>
          )}
        </div>
        <p className="text-[13px] text-[#888]">
          {cliente.proxima_accion || "Seguimiento pendiente"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/clientes/${cliente.id}?volver=enfoque&vistos=${vistosParam}&total=${total}`}
          className={buttonVariants({ size: "sm", className: "gap-1.5" })}
        >
          Ir a la ficha
          <ArrowRight className="size-3.5" />
        </Link>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={posponer}
          className="gap-1.5"
        >
          <Clock className="size-3.5" />
          {pending ? "..." : "Posponer para mañana"}
        </Button>
      </div>
    </div>
  );
}
