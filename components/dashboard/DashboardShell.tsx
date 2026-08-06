"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

export function DashboardShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [pathnameAnterior, setPathnameAnterior] = useState(pathname);

  // Cierra el menú al navegar a otra pantalla en celular. Ajustar estado
  // durante el render (no en un efecto) cuando cambia una prop/valor externo
  // es el patrón recomendado por React para este caso — evita el
  // renderizado extra que causaría un setState dentro de useEffect.
  if (pathname !== pathnameAnterior) {
    setPathnameAnterior(pathname);
    setOpen(false);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 flex transition-transform duration-200 ease-out md:static md:translate-x-0 md:transition-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-[#1A1A1A]"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                <path d="M3 14L9 4L15 14H3Z" fill="#0A0A0A" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white">PasoCRM</span>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
