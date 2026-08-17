"use client";

import { useSyncExternalStore } from "react";
import { NIVEL_IA_POR_DEFECTO, type NivelIA } from "@/lib/claude/modelos";

const CLAVE_STORAGE = "pasocrm-nivel-ia";
const listeners = new Set<() => void>();

function leerNivelGuardado(): NivelIA {
  const guardado = window.localStorage.getItem(CLAVE_STORAGE);
  return guardado === "basico" || guardado === "avanzado"
    ? guardado
    : NIVEL_IA_POR_DEFECTO;
}

function suscribirse(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Recuerda, en este navegador, qué nivel de IA eligió Edwin la última vez
 * (básico o avanzado) — compartido entre todas las funciones de IA del CRM
 * para que no tenga que elegirlo de nuevo en cada pantalla. Usa
 * useSyncExternalStore (en vez de useState + useEffect) por dos razones:
 * evita el mismatch de hidratación al leer localStorage, y hace que todos
 * los selectores abiertos a la vez se actualicen juntos cuando Edwin
 * cambia el nivel en cualquiera de ellos.
 */
export function useNivelIA(): [NivelIA, (nivel: NivelIA) => void] {
  const nivel = useSyncExternalStore(
    suscribirse,
    leerNivelGuardado,
    () => NIVEL_IA_POR_DEFECTO
  );

  function setNivel(nuevo: NivelIA) {
    window.localStorage.setItem(CLAVE_STORAGE, nuevo);
    listeners.forEach((callback) => callback());
  }

  return [nivel, setNivel];
}
