"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * Refresca la bandeja de WhatsApp en vivo cuando llega un mensaje nuevo —
 * mismo patrón que CotizacionRealtimeListener, pero sobre mensajes_whatsapp.
 */
export function WhatsappRealtimeListener({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("whatsapp-mensajes-nuevos")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes_whatsapp",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const nuevo = payload.new as { direccion?: string };
          if (nuevo.direccion === "entrante") {
            toast.info("Nuevo mensaje de WhatsApp");
          }
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return null;
}
