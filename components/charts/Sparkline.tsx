// Línea de tendencia simple vía SVG (polyline + puntos) — sin librería
// externa, mismo criterio que BarraComparativa.tsx.

export function Sparkline({
  datos,
  color = "var(--primary)",
}: {
  datos: { label: string; value: number }[];
  color?: string;
}) {
  const ANCHO = 600;
  const ALTO = 140;
  const PAD = 8;

  const max = Math.max(1, ...datos.map((d) => d.value));
  const paso = datos.length > 1 ? (ANCHO - PAD * 2) / (datos.length - 1) : 0;

  const puntos = datos.map((d, i) => {
    const x = PAD + i * paso;
    const y = ALTO - PAD - (d.value / max) * (ALTO - PAD * 2);
    return { x, y, ...d };
  });

  const puntosStr = puntos.map((p) => `${p.x},${p.y}`).join(" ");
  const primero = datos[0];
  const ultimo = datos[datos.length - 1];

  return (
    <div>
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="w-full"
        preserveAspectRatio="none"
      >
        <polyline
          points={puntosStr}
          fill="none"
          style={{ stroke: color }}
          strokeWidth={2}
        />
        {puntos.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} style={{ fill: color }} />
        ))}
      </svg>
      {primero && ultimo && (
        <div className="mt-1 flex justify-between text-[11px] text-[#555]">
          <span>{primero.label}</span>
          <span>{ultimo.label}</span>
        </div>
      )}
    </div>
  );
}
