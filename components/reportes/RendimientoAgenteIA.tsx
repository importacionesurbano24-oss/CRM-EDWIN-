import type { RendimientoAgenteIA as RendimientoAgenteIAType } from "@/lib/services/reportes.service";

/**
 * Solo proxies con datos reales — no muestra "ventas atribuidas al
 * agente en $" porque no existe ese vínculo causal en el esquema hoy.
 */
export function RendimientoAgenteIA({
  rendimiento,
}: {
  rendimiento: RendimientoAgenteIAType;
}) {
  const items = [
    {
      label: "Mensajes de WhatsApp redactados por el agente",
      valor: String(rendimiento.mensajesGenerados),
    },
    {
      label: "Leads creados automáticamente por WhatsApp",
      valor: String(rendimiento.leadsAutoCreados),
    },
    {
      label: "De esos leads (histórico), terminaron comprando",
      valor:
        rendimiento.tasaConversionLeads !== null
          ? `${rendimiento.tasaConversionLeads}%`
          : "—",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-border bg-[#141414] p-4">
          <div className="text-[24px] font-bold text-white">{item.valor}</div>
          <div className="mt-1 text-[12px] text-[#888]">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
