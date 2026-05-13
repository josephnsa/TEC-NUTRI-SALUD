import type { ListaItem } from "./ketoMercado";
import { getActivoPerfilId, getPrimerPerfilId, listPerfilesMiembros } from "./perfilStorage";

const HIST_KEY = "tec_nutri_salud_mercados_historial_v1";
/** Clave global legacy (sin multiperfil). */
const ACTIVE_KEY_LEGACY = "tec_nutri_salud_mercado_activo_plan_id_v1";
const MAX_SNAPSHOTS = 15;

export type MercadoSnapshot = {
  id: string;
  createdAt: string;
  dias: number;
  personas: number;
  items: ListaItem[];
  /** Perfil al que pertenece este mercado guardado (fase 2.2). */
  perfilId?: string;
};

export function activeMercadoStorageKey(perfilId: string): string {
  return `tec_nutri_salud_mercado_activo_plan_id_v1__${perfilId}`;
}

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

function migratePerfilIds(list: MercadoSnapshot[]): MercadoSnapshot[] {
  const owner = getPrimerPerfilId() ?? getActivoPerfilId();
  if (!owner) return list;
  let changed = false;
  const next = list.map((s) => {
    if (s.perfilId) return s;
    changed = true;
    return { ...s, perfilId: owner };
  });
  if (changed) {
    localStorage.setItem(HIST_KEY, JSON.stringify(next));
  }
  return changed ? next : list;
}

function writeHistorial(list: MercadoSnapshot[]) {
  localStorage.setItem(HIST_KEY, JSON.stringify(list));
}

export function listarMercadosRealizados(): MercadoSnapshot[] {
  const migrated = migratePerfilIds(parseHistorial());
  const pid = getActivoPerfilId();
  const base = !pid ? migrated.filter((s) => !s.perfilId) : migrated.filter((s) => s.perfilId === pid);
  return base.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Lista completa sin filtrar por perfil (p. ej. export). */
export function listarTodosMercadosInternos(): MercadoSnapshot[] {
  return migratePerfilIds(parseHistorial()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function guardarMercadoRealizado(dias: number, personas: number, items: ListaItem[]): MercadoSnapshot {
  const id = crypto.randomUUID();
  const pid = getActivoPerfilId() ?? undefined;
  const snap: MercadoSnapshot = {
    id,
    createdAt: new Date().toISOString(),
    dias,
    personas,
    items: items.map((i) => ({ ...i })),
    ...(pid ? { perfilId: pid } : {})
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
    const pid = getActivoPerfilId();
    if (pid) localStorage.removeItem(activeMercadoStorageKey(pid));
    else localStorage.removeItem(ACTIVE_KEY_LEGACY);
  }
}

export function getMercadoRealizado(id: string): MercadoSnapshot | null {
  return parseHistorial().find((s) => s.id === id) ?? null;
}

export function setMercadoActivoParaPlan(id: string | null) {
  const pid = getActivoPerfilId();
  if (!pid) {
    if (!id) localStorage.removeItem(ACTIVE_KEY_LEGACY);
    else localStorage.setItem(ACTIVE_KEY_LEGACY, id);
    return;
  }
  const k = activeMercadoStorageKey(pid);
  if (!id) localStorage.removeItem(k);
  else localStorage.setItem(k, id);
}

export function getMercadoActivoParaPlan(): string | null {
  const pid = getActivoPerfilId();
  if (!pid) {
    return localStorage.getItem(ACTIVE_KEY_LEGACY);
  }
  const k = activeMercadoStorageKey(pid);
  const cur = localStorage.getItem(k);
  if (cur) return cur;
  const leg = localStorage.getItem(ACTIVE_KEY_LEGACY);
  if (leg) {
    localStorage.setItem(k, leg);
    localStorage.removeItem(ACTIVE_KEY_LEGACY);
    return leg;
  }
  return null;
}

/** Elimina mercados y clave activa asociados a un perfil (al borrar persona). */
export function purgeMercadoDePerfil(perfilId: string) {
  const list = parseHistorial().filter((s) => s.perfilId !== perfilId);
  writeHistorial(list);
  localStorage.removeItem(activeMercadoStorageKey(perfilId));
}

export function contarComprados(items: ListaItem[]): number {
  return items.filter((i) => i.comprado).length;
}

export type MercadoExportV1 = {
  v: 1;
  exportedAt: string;
  historial: MercadoSnapshot[];
  activoId: string | null;
  /** Opcional: mercado activo por perfil (multiperfil). */
  activoPorPerfil?: Record<string, string | null>;
};

export function construirExportMercado(): MercadoExportV1 {
  const historial = listarTodosMercadosInternos();
  const miembros = listPerfilesMiembros();
  const activoPorPerfil: Record<string, string | null> = {};
  for (const m of miembros) {
    activoPorPerfil[m.id] = localStorage.getItem(activeMercadoStorageKey(m.id));
  }
  return {
    v: 1,
    exportedAt: new Date().toISOString(),
    historial,
    activoId: getMercadoActivoParaPlan(),
    ...(miembros.length ? { activoPorPerfil } : {})
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

  const activoMap = root.activoPorPerfil as Record<string, string> | undefined;
  if (activoMap && typeof activoMap === "object") {
    for (const [pid, mid] of Object.entries(activoMap)) {
      if (typeof mid === "string" && fusionados.some((s) => s.id === mid)) {
        localStorage.setItem(activeMercadoStorageKey(pid), mid);
      }
    }
  }

  const activo = root.activoId;
  if (typeof activo === "string" && fusionados.some((s) => s.id === activo)) {
    setMercadoActivoParaPlan(activo);
  }

  return { ok: true, fusionados: entrantes.length };
}
