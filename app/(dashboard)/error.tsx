"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
      <p className="text-sm font-medium text-foreground">
        Algo salió mal cargando esta pantalla.
      </p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Puede ser una conexión intermitente con la base de datos. Intenta de
        nuevo; si el problema sigue, revisa que las variables de Supabase en
        .env.local sean correctas.
      </p>
      <Button onClick={() => reset()} variant="outline" size="sm">
        Reintentar
      </Button>
    </div>
  );
}
