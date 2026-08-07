// Donut vía SVG (stroke-dasharray por segmento) — sin librería externa,
// mismo criterio que el resto de components/charts/.

export function Donut({
  segmentos,
}: {
  segmentos: { label: string; value: number; color: string }[];
}) {
  const total = segmentos.reduce((s, d) => s + d.value, 0);
  const RADIO = 60;
  const GROSOR = 20;
  const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

  let acumulado = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 140 140" className="size-[140px] shrink-0 -rotate-90">
        {total === 0 ? (
          <circle
            cx={70}
            cy={70}
            r={RADIO}
            fill="none"
            stroke="var(--border)"
            strokeWidth={GROSOR}
          />
        ) : (
          segmentos
            .filter((s) => s.value > 0)
            .map((s) => {
              const fraccion = s.value / total;
              const largo = fraccion * CIRCUNFERENCIA;
              const offset = -acumulado * CIRCUNFERENCIA;
              acumulado += fraccion;
              return (
                <circle
                  key={s.label}
                  cx={70}
                  cy={70}
                  r={RADIO}
                  fill="none"
                  style={{ stroke: s.color }}
                  strokeWidth={GROSOR}
                  strokeDasharray={`${largo} ${CIRCUNFERENCIA - largo}`}
                  strokeDashoffset={offset}
                />
              );
            })
        )}
      </svg>
      <div className="flex flex-col gap-2">
        {segmentos.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-[#999]">{s.label}</span>
            <span className="font-semibold text-[#F0F0F0]">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
