import { ketoCatalog, type KetoItem } from "../data/ketoCatalog";

export type ListaItem = KetoItem & { cantidad: number; comprado: boolean };

const STORAGE_KEY = "tec_nutri_salud_keto_lista_v1";

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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ListaGuardada;
  } catch {
    return null;
  }
}

export function saveListaLocal(data: ListaGuardada) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearListaLocal() {
  localStorage.removeItem(STORAGE_KEY);
}
