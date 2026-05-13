import { ketoCatalog, type KetoItem } from "../data/ketoCatalog";

import { getActivoPerfilId } from "./perfilStorage";

export type ListaItem = KetoItem & { cantidad: number; comprado: boolean };

function listaStorageKey(): string {
  const pid = getActivoPerfilId();
  return pid ? `tec_nutri_salud_keto_lista_v1__${pid}` : "tec_nutri_salud_keto_lista_v1";
}

export type ListaGuardada = {
  dias: number;
  personas: number;
  items: ListaItem[];
  updatedAt: string;
};

function roundCantidad(n: number, unidad: string): number {
  if (unidad === "unidades") return Math.max(1, Math.ceil(n * 2) / 2);
  if (unidad === "ml" || unidad === "g") return Math.max(1, Math.round(n / 5) * 5);
  return Math.max(1, Math.round(n));
}

export function generarListaKeto(dias: number, personas: number): ListaItem[] {
  const d = Math.min(30, Math.max(1, Math.round(dias)));
  const p = Math.min(12, Math.max(1, Math.round(personas)));
  return ketoCatalog.map((item) => ({
    ...item,
    cantidad: roundCantidad(item.basePorPersonaDia * d * p, item.unidad),
    comprado: false
  }));
}

export function loadListaLocal(): ListaGuardada | null {
  try {
    const key = listaStorageKey();
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as ListaGuardada;
    const pid = getActivoPerfilId();
    if (pid) {
      const legacyKey = "tec_nutri_salud_keto_lista_v1";
      const leg = localStorage.getItem(legacyKey);
      if (leg) {
        localStorage.setItem(key, leg);
        localStorage.removeItem(legacyKey);
        return JSON.parse(leg) as ListaGuardada;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function saveListaLocal(data: ListaGuardada) {
  localStorage.setItem(listaStorageKey(), JSON.stringify(data));
}

export function clearListaLocal() {
  localStorage.removeItem(listaStorageKey());
}
