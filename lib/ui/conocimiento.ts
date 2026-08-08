import type { SeccionConocimiento } from "@/lib/types";

export const SECCION_META: Record<
  SeccionConocimiento,
  { label: string; placeholder: string }
> = {
  datos_empresa: {
    label: "Datos de la empresa",
    placeholder: "Dirección, horarios de atención, redes sociales...",
  },
  catalogo: {
    label: "Catálogo",
    placeholder: "Colchón ortopédico XL — $XXX.XXX, base cama doble reforzada...",
  },
  promociones: {
    label: "Promociones vigentes",
    placeholder: "2x1 en almohadas todo agosto...",
  },
  garantias: {
    label: "Garantías",
    placeholder: "10 años contra hundimiento en colchones ortopédicos...",
  },
  proceso_venta: {
    label: "Proceso de venta",
    placeholder: "Primero preguntar tipo de cama, luego mostrar catálogo...",
  },
  objeciones: {
    label: "Objeciones frecuentes",
    placeholder: "\"Está muy caro\" → ..., \"Lo voy a pensar\" → ...",
  },
  preguntas_frecuentes: {
    label: "Preguntas frecuentes",
    placeholder: "¿Hacen domicilios? ¿Reciben el colchón viejo?",
  },
  tono: {
    label: "Tono de voz",
    placeholder: "Cercano, tuteando, nunca agresivo...",
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
