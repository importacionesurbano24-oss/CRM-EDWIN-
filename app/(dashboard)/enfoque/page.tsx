import Link from "next/link";
import { PartyPopper, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getClientesConEtapa } from "@/lib/data/clientes";
import { getUltimosMensajesPorCliente } from "@/lib/data/whatsapp";
import { esPendienteHoy } from "@/lib/ui/urgencia";
import { generarAlertasBriefing } from "@/lib/services/briefing.service";
import { construirColaEnfoque } from "@/lib/services/enfoque.service";
import { ItemBriefingEnfoque } from "@/components/enfoque/ItemBriefingEnfoque";
import { ItemHoyTocaEnfoque } from "@/components/enfoque/ItemHoyTocaEnfoque";

function parseVistos(valor?: string): Set<string> {
  if (!valor) return new Set();
  return new Set(valor.split(",").filter(Boolean));
}

export default async function EnfoquePage({
  searchParams,
}: {
  searchParams: Promise<{ vistos?: string; total?: string }>;
}) {
  const { vistos: vistosQuery, total: totalQuery } = await searchParams;
  const supabase = await createClient();

  const [clientes, ultimosMensajesWhatsapp] = await Promise.all([
    getClientesConEtapa(supabase),
    getUltimosMensajesPorCliente(supabase),
  ]);

  const tareasHoy = clientes.filter((c) => esPendienteHoy(c.proxima_accion_fecha));
  const alertasBriefing = generarAlertasBriefing(clientes, ultimosMensajesWhatsapp);
  const vistos = parseVistos(vistosQuery);
  const cola = construirColaEnfoque(alertasBriefing, tareasHoy, vistos);

  // `total` es puramente informativo (contador "Tarea N de M") — nunca se
  // usa para decidir qué mostrar ni para filtrar la cola.
  const total = totalQuery ? Number(totalQuery) : cola.length;
  const completadas = Math.max(0, total - cola.length);
  const item = cola[0] ?? null;
  const vistosArray = Array.from(vistos);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex w-full max-w-lg items-center justify-between">
        <span className="text-xs tracking-wide text-[#555] uppercase">
          {item ? `Tarea ${completadas + 1} de ${total}` : "Modo enfoque"}
        </span>
        <Link
          href="/tareas"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#666] hover:text-foreground"
        >
          <X className="size-3.5" />
          Salir del modo enfoque
        </Link>
      </div>

      {!item ? (
        <div className="flex w-full max-w-lg flex-col items-center gap-3 rounded-[14px] border border-border bg-card p-10 text-center">
          <PartyPopper className="size-8 text-primary" />
          <h1 className="text-lg font-bold text-white">
            Terminaste tus tareas de hoy
          </h1>
          <Link
            href="/inicio"
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            Ir a inicio
          </Link>
        </div>
      ) : item.tipo === "briefing" ? (
        <ItemBriefingEnfoque item={item} vistosArray={vistosArray} total={total} />
      ) : (
        <ItemHoyTocaEnfoque item={item} vistosArray={vistosArray} total={total} />
      )}
    </div>
  );
}
