import Link from "next/link";
import { Compass } from "lucide-react";

/**
 * Se muestra en la ficha del cliente cuando se llegó desde el modo
 * enfoque (?volver=enfoque). El link vuelve a /enfoque con el mismo
 * `vistos`/`total` — si esta tarea no se resolvió de verdad (ver
 * lib/services/enfoque.service.ts), vuelve a aparecer, a propósito.
 */
export function BannerModoEnfoque({
  vistos,
  total,
}: {
  vistos?: string;
  total?: string;
}) {
  const params = new URLSearchParams();
  if (vistos) params.set("vistos", vistos);
  if (total) params.set("total", total);
  const query = params.toString();
  const href = `/enfoque${query ? `?${query}` : ""}`;

  return (
    <div className="mb-6 flex items-center justify-between rounded-[14px] border border-primary/30 bg-primary/5 px-4 py-3">
      <div className="flex items-center gap-2 text-[13px] text-[#D0D0D0]">
        <Compass className="size-4 text-primary" />
        Estás en modo enfoque
      </div>
      <Link href={href} className="text-[13px] font-medium text-primary hover:underline">
        Volver al modo enfoque
      </Link>
    </div>
  );
}
