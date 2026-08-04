const PALETTE = [
  "#FFDD00",
  "#CCFF00",
  "#FF6B6B",
  "#6BDDFF",
  "#FF9F43",
  "#A29BFE",
  "#FD79A8",
];

/** Color estable por cliente (mismo id → mismo color siempre). */
export function colorAvatar(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export function inicial(nombre: string): string {
  return nombre.trim().charAt(0).toUpperCase() || "?";
}
