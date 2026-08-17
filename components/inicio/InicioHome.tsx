"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Syne } from "next/font/google";
import {
  Search,
  X,
  Zap,
  Star,
  UserPlus,
  LayoutGrid,
  ListChecks,
  MessageCircle,
  BarChart3,
} from "lucide-react";
import { useNivelIA } from "@/lib/hooks/useNivelIA";

const syne = Syne({ subsets: ["latin"], weight: ["600", "700", "800"] });

const SUGERENCIAS = [
  "¿Cuántos prospectos tengo esta semana?",
  "¿Quién no ha respondido en 3 días?",
  "Muéstrame las tareas de hoy",
  "¿Cuál es mi tasa de cierre este mes?",
  "Prospectos calientes del pipeline",
];

const ACCIONES_RAPIDAS = [
  { href: "/clientes/nuevo", label: "Nuevo prospecto", icon: UserPlus },
  { href: "/pipeline", label: "Ver pipeline", icon: LayoutGrid },
  { href: "/tareas", label: "Tareas pendientes", icon: ListChecks },
  {
    href: "/whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    hoverClass: "hover:border-[#25D366] hover:text-[#25D366]",
  },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];

function calcularSaludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

// No hay nada externo que escuchar — el saludo se calcula una sola vez
// (a diferencia de useNivelIA, no necesita re-sincronizar entre pestañas).
function suscribirseSaludo() {
  return () => {};
}

/**
 * Pantalla de bienvenida de /inicio: buscador central, selector de nivel
 * de IA (comparte estado con el resto del CRM vía useNivelIA) y accesos
 * rápidos a las secciones principales. El saludo depende de la hora real
 * de Edwin, que el servidor no conoce — useSyncExternalStore evita el
 * mismatch de hidratación usando "Buenas tardes" como snapshot del
 * servidor y corrigiendo al valor real apenas monta en el cliente.
 */
export function InicioHome() {
  const saludo = useSyncExternalStore(
    suscribirseSaludo,
    calcularSaludo,
    () => "Buenas tardes"
  );
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [enfocado, setEnfocado] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [nivel, setNivel] = useNivelIA();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (enfocado) return;
    const id = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % SUGERENCIAS.length);
    }, 3000);
    return () => clearInterval(id);
  }, [enfocado]);

  function limpiarBusqueda() {
    setBusqueda("");
    inputRef.current?.focus();
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 pt-12 pb-[72px]">
      {/* Resplandor de fondo */}
      <div
        className="pointer-events-none absolute top-[30%] left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(204,255,0,0.06)_0%,transparent_70%)]"
        aria-hidden="true"
      />

      {/* Avatar + saludo */}
      <div className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both mb-[52px] flex items-center gap-3.5 duration-500">
        <div
          className={`flex size-[52px] shrink-0 items-center justify-center rounded-[14px] bg-brand-lime text-[22px] font-extrabold text-brand-lime-foreground ${syne.className}`}
        >
          P
        </div>
        <div>
          <div className={`text-[17px] font-semibold text-white ${syne.className}`}>
            {saludo}, Edwin
          </div>
          <div className="mt-0.5 text-[12px] tracking-[0.08em] text-[#555]">
            PASOCRM &nbsp;·&nbsp; DORMILUNA
          </div>
        </div>
      </div>

      {/* Titular */}
      <div
        className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both max-w-[640px] text-center duration-500 [animation-delay:100ms]"
      >
        <h1
          className={`mb-[18px] text-[clamp(2.25rem,5vw,3.625rem)] leading-[1.1] font-extrabold tracking-tight text-white ${syne.className}`}
        >
          ¿Con quién <span className="text-brand-lime">trabajamos</span> hoy?
        </h1>
        <p className="text-base leading-relaxed text-[#666]">
          Busca un cliente, prospecto o deja que el agente IA te diga dónde
          enfocar tu energía.
        </p>
      </div>

      {/* Buscador */}
      <div
        className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both mt-10 w-full max-w-[560px] duration-500 [animation-delay:200ms]"
      >
        <div className="flex h-[60px] items-center gap-3 rounded-2xl border border-[#2a2a2a] bg-[#161616] px-5 transition-colors focus-within:border-brand-lime">
          <Search className="size-[18px] shrink-0 text-[#555]" />
          <input
            ref={inputRef}
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onFocus={() => setEnfocado(true)}
            onBlur={() => setEnfocado(false)}
            placeholder={SUGERENCIAS[placeholderIndex]}
            className="flex-1 border-none bg-transparent text-[15px] text-white caret-brand-lime outline-none placeholder:text-[#555]"
          />
          {busqueda && (
            <button
              type="button"
              onClick={limpiarBusqueda}
              className="flex items-center text-[#444] transition-colors hover:text-[#888]"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Selector de nivel de IA — comparte estado con el resto del CRM */}
      <div
        className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both mt-3.5 flex items-center gap-2 rounded-full border border-[#222] bg-[#111] p-1 duration-500 [animation-delay:250ms]"
      >
        <button
          type="button"
          onClick={() => setNivel("basico")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] transition-all ${
            nivel === "basico"
              ? "bg-brand-lime text-brand-lime-foreground"
              : "text-[#555] hover:text-[#888]"
          }`}
        >
          <Zap className="size-[13px]" />
          Modelo rápido
        </button>
        <button
          type="button"
          onClick={() => setNivel("avanzado")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] transition-all ${
            nivel === "avanzado"
              ? "bg-brand-lime text-brand-lime-foreground"
              : "text-[#555] hover:text-[#888]"
          }`}
        >
          <Star className="size-[13px]" />
          Modelo preciso
        </button>
      </div>

      {/* Accesos rápidos */}
      <div
        className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both mt-7 flex max-w-[640px] flex-wrap justify-center gap-2.5 duration-500 [animation-delay:300ms]"
      >
        {ACCIONES_RAPIDAS.map(({ href, label, icon: Icon, hoverClass }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#161616] px-[18px] py-2.5 text-sm text-[#ccc] transition-colors ${
              hoverClass ?? "hover:border-brand-lime hover:text-white"
            }`}
          >
            <Icon className="size-[15px]" />
            {label}
          </Link>
        ))}
      </div>

      {/* Pie */}
      <div
        className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both absolute bottom-7 flex items-center gap-1.5 text-[13px] text-[#444] duration-500 [animation-delay:400ms]"
      >
        Powered by
        <span className="font-semibold text-brand-lime">Claude AI</span>
        <span className="mx-1">·</span>
        Tu agente de ventas inteligente está activo
        <span className="size-2 animate-pulse rounded-full bg-[#22c55e]" />
      </div>
    </div>
  );
}
