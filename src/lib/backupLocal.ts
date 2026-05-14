/** Respaldo JSON de datos en `localStorage` (prefijo app). IndexedDB (fotos del día) no se exporta ni importa aquí. */

import { CRONOGRAMA_HISTORIAL_EVENT } from "./cronogramaHistorial";
import { ADJUNTOS_DIA_EVENT } from "./diaAdjuntosIDB";
import { PERFILES_STORAGE_EVENT } from "./perfilStorage";

const PREFIX = "tec_nutri_salud_";

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v && typeof v === "object" && !Array.isArray(v));
}

export function recolectarLocalStorageNutri(): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(PREFIX)) continue;
      out[k] = localStorage.getItem(k);
    }
  } catch {
    /* private mode / quota */
  }
  return out;
}

/** Quita todas las claves `tec_nutri_salud_*` antes de restaurar un respaldo completo. */
export function limpiarLocalStorageNutri(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) toRemove.push(k);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

export function descargarRespaldoCompletoJson(): void {
  try {
    const localStorageSnapshot = recolectarLocalStorageNutri();
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: "tec-nutri-salud",
      note:
        "Incluye perfiles, mercados, cronograma en historial, listas keto y claves activas. No incluye fotos/vídeos del día (IndexedDB).",
      localStorage: localStorageSnapshot
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tec-nutri-salud-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
}

export function contarClavesRespaldo(): number {
  return Object.keys(recolectarLocalStorageNutri()).length;
}

/**
 * Valida un JSON de respaldo v1 y devuelve el mapa `localStorage` a aplicar, o null.
 */
export function validarYExtraerRespaldoV1(parsed: unknown): Record<string, string | null> | null {
  if (!isRecord(parsed)) return null;
  if (parsed.version !== 1) return null;
  const ls = parsed.localStorage;
  if (!isRecord(ls)) return null;
  const out: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(ls)) {
    if (typeof k !== "string" || !k.startsWith(PREFIX)) continue;
    if (v === null) out[k] = null;
    else if (typeof v === "string") out[k] = v;
    else return null;
  }
  return out;
}

export function aplicarSnapshotLocalStorage(snapshot: Record<string, string | null>): number {
  let n = 0;
  try {
    for (const [k, v] of Object.entries(snapshot)) {
      if (!k.startsWith(PREFIX)) continue;
      if (v === null) localStorage.removeItem(k);
      else {
        localStorage.setItem(k, v);
        n++;
      }
    }
  } catch {
    /* quota */
  }
  return n;
}

export function notificarRefrescoTrasRespaldo(): void {
  try {
    window.dispatchEvent(new CustomEvent(PERFILES_STORAGE_EVENT, { detail: {} }));
    window.dispatchEvent(new CustomEvent(CRONOGRAMA_HISTORIAL_EVENT, { detail: {} }));
    window.dispatchEvent(new CustomEvent(ADJUNTOS_DIA_EVENT, { detail: {} }));
  } catch {
    /* ignore */
  }
}

/**
 * Reemplaza por completo los datos `tec_nutri_salud_*` locales por los del archivo.
 */
export function importarRespaldoReemplazandoTodo(
  json: string
): { ok: true; claves: number } | { ok: false; error: string } {
  try {
    const data = JSON.parse(json) as unknown;
    const snap = validarYExtraerRespaldoV1(data);
    if (!snap) return { ok: false, error: "El archivo no es un respaldo válido (versión 1)." };
    limpiarLocalStorageNutri();
    const n = aplicarSnapshotLocalStorage(snap);
    notificarRefrescoTrasRespaldo();
    return { ok: true, claves: n };
  } catch {
    return { ok: false, error: "No se pudo leer el JSON." };
  }
}
