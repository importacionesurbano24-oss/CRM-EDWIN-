import {
  Building2,
  Package,
  Tag,
  ShieldCheck,
  Route,
  MessagesSquare,
  CircleHelp,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import type { SeccionConocimiento } from "@/lib/types";

export const SECCION_META: Record<
  SeccionConocimiento,
  { label: string; placeholder: string; icon: LucideIcon }
> = {
  datos_empresa: {
    label: "Datos de la empresa",
    placeholder: "Dirección, horarios de atención, redes sociales...",
    icon: Building2,
  },
  catalogo: {
    label: "Catálogo",
    placeholder: "Colchón ortopédico XL — $XXX.XXX, base cama doble reforzada...",
    icon: Package,
  },
  promociones: {
    label: "Promociones vigentes",
    placeholder: "2x1 en almohadas todo agosto...",
    icon: Tag,
  },
  garantias: {
    label: "Garantías",
    placeholder: "10 años contra hundimiento en colchones ortopédicos...",
    icon: ShieldCheck,
  },
  proceso_venta: {
    label: "Proceso de venta",
    placeholder: "Primero preguntar tipo de cama, luego mostrar catálogo...",
    icon: Route,
  },
  objeciones: {
    label: "Objeciones frecuentes",
    placeholder: "\"Está muy caro\" → ..., \"Lo voy a pensar\" → ...",
    icon: MessagesSquare,
  },
  preguntas_frecuentes: {
    label: "Preguntas frecuentes",
    placeholder: "¿Hacen domicilios? ¿Reciben el colchón viejo?",
    icon: CircleHelp,
  },
  tono: {
    label: "Tono de voz",
    placeholder: "Cercano, tuteando, nunca agresivo...",
    icon: Volume2,
  },
};

export const ORDEN_SECCIONES: SeccionConocimiento[] = [
  "datos_empresa",
  "catalogo",
  "promociones",
  "garantias",
  "proceso_venta",
  "objeciones",
  "preguntas_frecuentes",
  "tono",
];
