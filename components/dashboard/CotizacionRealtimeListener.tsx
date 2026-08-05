"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * Avisa a Edwin en vivo cuando un cliente abre su link de cotización.
 * marcarVistaSiCorresponde() en el servidor solo actualiza estado a "vista"
 * la primera vez, así que cada evento UPDATE con estado="vista" que llega
 * acá es, por construcción, una vista nueva — no hace falta comparar contra
 * el valor anterior de la fila.
 */
export function CotizacionRealtimeListener({ userId }: { userId: string }) {
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("cotizaciones-vistas")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "cotizaciones",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const nueva = payload.new as { estado?: string };
          if (nueva.estado === "vista") {
            toast.info("Un cliente vio su cotización", {
              description: "Revisa la pestaña Cotizaciones.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
