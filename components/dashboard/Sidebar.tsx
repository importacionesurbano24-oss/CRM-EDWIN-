import Link from "next/link";
import { SidebarNav } from "./SidebarNav";
import { LogoutButton } from "./LogoutButton";

interface SidebarProps {
  pendientesHoy: number;
  userEmail: string;
}

export function Sidebar({ pendientesHoy, userEmail }: SidebarProps) {
  const inicial = (userEmail.charAt(0) || "E").toUpperCase();

  return (
    <aside className="flex w-[220px] min-w-[220px] flex-col border-r border-sidebar-border bg-sidebar">
      <div className="border-b border-sidebar-border px-5 py-6">
        <Link href="/inicio" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 14L9 4L15 14H3Z" fill="#0A0A0A" />
            </svg>
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-tight text-white">
              PasoCRM
            </div>
            <div className="text-[10px] tracking-wider text-[#444] uppercase">
              Dormiluna
            </div>
          </div>
        </Link>
      </div>

      <SidebarNav />

      <div className="px-2.5 pb-2.5">
        <div className="px-2 pb-2 text-[10px] tracking-wide text-[#333] uppercase">
          Hoy
        </div>
        <Link
          href="/tareas"
          className="flex items-center gap-2 rounded-lg bg-[#1A1A1A] px-3 py-2.5 transition-colors hover:bg-[#222]"
        >
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-brand-lime" />
          <div>
            <div className="text-[11px] text-[#888]">Pendientes hoy</div>
            <div className="text-lg leading-none font-bold text-primary">
              {pendientesHoy}
            </div>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2.5 border-t border-sidebar-border px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand-lime text-[13px] font-bold text-[#0A0A0A]">
          {inicial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-foreground">
            {userEmail || "Vendedor"}
          </div>
          <div className="text-[11px] text-[#444]">Vendedor</div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
