import { colorAvatar, inicial } from "@/lib/ui/avatar";

export function ClienteAvatar({
  id,
  nombre,
  size = 32,
}: {
  id: string;
  nombre: string;
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg font-bold text-[#0A0A0A]"
      style={{
        background: colorAvatar(id),
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
      }}
    >
      {inicial(nombre)}
    </div>
  );
}
