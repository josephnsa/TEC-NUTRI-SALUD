import type { ListaItem } from "./ketoMercado";

const HIST_KEY = "tec_nutri_salud_mercados_historial_v1";
const ACTIVE_KEY = "tec_nutri_salud_mercado_activo_plan_id_v1";
const MAX_SNAPSHOTS = 15;

export type MercadoSnapshot = {
  id: string;
  createdAt: string;
  dias: number;
  personas: number;
  items: ListaItem[];
};

function parseHistorial(): MercadoSnapshot[] {
  try {
    const raw = localStorage.getItem(HIST_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as MercadoSnapshot[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeHistorial(list: MercadoSnapshot[]) {
  localStorage.setItem(HIST_KEY, JSON.stringify(list));
}

export function listarMercadosRealizados(): MercadoSnapshot[] {
  return parseHistorial().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function guardarMercadoRealizado(dias: number, personas: number, items: ListaItem[]): MercadoSnapshot {
  const id = crypto.randomUUID();
  const snap: MercadoSnapshot = {
    id,
    createdAt: new Date().toISOString(),
    dias,
    personas,
    items: items.map((i) => ({ ...i }))
  };
  const list = [snap, ...parseHistorial()].slice(0, MAX_SNAPSHOTS);
  writeHistorial(list);
  setMercadoActivoParaPlan(id);
  return snap;
}

export function eliminarMercadoRealizado(id: string) {
  const list = parseHistorial().filter((s) => s.id !== id);
  writeHistorial(list);
  if (getMercadoActivoParaPlan() === id) {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

export function getMercadoRealizado(id: string): MercadoSnapshot | null {
  return parseHistorial().find((s) => s.id === id) ?? null;
}

export function setMercadoActivoParaPlan(id: string | null) {
  if (!id) localStorage.removeItem(ACTIVE_KEY);
  else localStorage.setItem(ACTIVE_KEY, id);
}

export function getMercadoActivoParaPlan(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function contarComprados(items: ListaItem[]): number {
  return items.filter((i) => i.comprado).length;
}

export type MercadoExportV1 = {
  v: 1;
  exportedAt: string;
  historial: MercadoSnapshot[];
  activoId: string | null;
};

export function construirExportMercado(): MercadoExportV1 {
  return {
    v: 1,
    exportedAt: new Date().toISOString(),
    historial: listarMercadosRealizados(),
    activoId: getMercadoActivoParaPlan()
  };
}

export function descargarRespaldoMercadoJson() {
  const json = JSON.stringify(construirExportMercado(), null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tec-nutri-salud-mercado-${new Date().toISOString().slice(0, 10)}.json`;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}

function esSnapshotValido(x: unknown): x is MercadoSnapshot {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.dias === "number" &&
    typeof o.personas === "number" &&
    Array.isArray(o.items)
  );
}

/** Fusiona entradas por id; conserva como máximo MAX_SNAPSHOTS más recientes. */
export function importarRespaldoMercadoJson(texto: string): { ok: true; fusionados: number } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(texto) as unknown;
  } catch {
    return { ok: false, error: "No es un JSON válido." };
  }
  if (!data || typeof data !== "object") return { ok: false, error: "Formato vacío." };
  const root = data as Record<string, unknown>;
  if (root.v !== 1) return { ok: false, error: "Versión de archivo no soportada (se espera v: 1)." };
  const arr = root.historial;
  if (!Array.isArray(arr)) return { ok: false, error: 'Falta el array "historial".' };
  const entrantes = arr.filter(esSnapshotValido);
  if (!entrantes.length) return { ok: false, error: "No hay mercados válidos en el archivo." };

  const mapa = new Map<string, MercadoSnapshot>();
  for (const s of parseHistorial()) mapa.set(s.id, s);
  for (const s of entrantes) {
    mapa.set(s.id, {
      ...s,
      items: s.items.map((i) => ({ ...i }))
    });
  }
  const fusionados = [...mapa.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_SNAPSHOTS);
  writeHistorial(fusionados);

  const activo = root.activoId;
  if (typeof activo === "string" && fusionados.some((s) => s.id === activo)) {
    setMercadoActivoParaPlan(activo);
  }

  return { ok: true, fusionados: entrantes.length };
}
