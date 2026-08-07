// Gráfico de barras verticales simple, sin librería externa — coherente
// con el resto de PasoCRM (el widget "Pipeline" del dashboard ya usa el
// mismo enfoque de divs con ancho/alto proporcional en vez de una lib de
// charts).

export function BarraComparativa({
  datos,
}: {
  datos: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(1, ...datos.map((d) => d.value));

  return (
    <div className="flex h-[180px] items-end gap-4 px-2">
      {datos.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-sm font-semibold text-[#F0F0F0]">
            {d.value}
          </span>
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${Math.max(4, (d.value / max) * 100)}%`,
                background: d.color,
              }}
            />
          </div>
          <span className="text-center text-[11px] leading-tight text-[#666]">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
