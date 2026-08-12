"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, BarChart3, ListChecks, GraduationCap, MessageCircle } from "lucide-react";

// Los módulos de Cotizaciones y Pedidos siguen existiendo (/cotizaciones,
// /pedidos) pero se ocultaron del menú: Edwin maneja todo el seguimiento
// del cliente (incluida la compra) desde "Registrar seguimiento" en
// /clientes/[id]. No se borró el código ni los datos.
const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutGrid },
  { href: "/tareas", label: "Tareas", icon: ListChecks },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/conocimiento", label: "Entrenamiento", icon: GraduationCap },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-0.5 p-2.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-[#1A1A1A] text-primary"
                : "text-[#666] hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
