import type { DiaPlan, ModoCronograma } from "./nutritionPlan";
import { fechaInicioEfectivaParaDias, fechaIsoParaDiaN } from "./planFechas";

const STORAGE_KEY = "tec_nutri_salud_cronograma_historial_v1";
const MAX_SNAPSHOTS = 48;

function activeSnapKey(perfilId: string) {
  return `tec_nutri_salud_cronograma_activo_v1__${perfilId}`;
}

export const CRONOGRAMA_HISTORIAL_EVENT = "tec-nutri-salud-cronograma-historial";

export type FuenteCronograma = "plantillas" | "ia";

export type DiaPlanConFecha = DiaPlan & { fecha: string };

export type CronogramaSnapshot = {
  id: string;
  perfilId: string;
  createdAt: string;
  fechaInicio: string | null;
  dias: number;
  modo: ModoCronograma;
  fuente: FuenteCronograma;
  mercadoActivoId: string | null;
  claveVariedad: string | null;
  diasPlan: DiaPlanConFecha[];
  /** Nombre amigable editable (ej. "Semana 19 mayo"). */
  titulo?: string;
};

function emitHistorial() {
  try {
    window.dispatchEvent(new CustomEvent(CRONOGRAMA_HISTORIAL_EVENT, { detail: {} }));
  } catch {
    /* ignore */
  }
}

function readRaw(): CronogramaSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter(isSnapshotValid);
  } catch {
    return [];
  }
}

function isSnapshotValid(x: unknown): x is CronogramaSnapshot {
  if (!x || typeof x !== "object") return false;
  const o = x as Partial<CronogramaSnapshot>;
  if (typeof o.id !== "string" || typeof o.perfilId !== "string") return false;
  if (typeof o.createdAt !== "string" || typeof o.dias !== "number") return false;
  if (o.modo !== "perfil" && o.modo !== "mercado" && o.modo !== "mixto") return false;
  if (o.fuente !== "plantillas" && o.fuente !== "ia") return false;
  if (!Array.isArray(o.diasPlan)) return false;
  for (const d of o.diasPlan) {
    if (!d || typeof d !== "object") return false;
    const day = d as Partial<DiaPlanConFecha>;
    if (typeof day.dia !== "number" || typeof day.fecha !== "string") return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.fecha)) return false;
    if (!day.comidas || typeof day.comidas !== "object") return false;
  }
  return true;
}

function writeAll(list: CronogramaSnapshot[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    emitHistorial();
  } catch {
    /* quota / private mode */
  }
}

/** Asigna fecha civil a cada día del plan según inicio (o fallback al guardar). */
export function adjuntarFechasADias(
  dias: DiaPlan[],
  fechaInicioPlan: string | null | undefined,
  fallbackInicioIso?: string
): DiaPlanConFecha[] {
  const inicio = fechaInicioEfectivaParaDias(fechaInicioPlan, fallbackInicioIso);
  return dias.map((d) => {
    const fecha = fechaIsoParaDiaN(inicio, d.dia);
    return { ...d, fecha: fecha ?? inicio };
  });
}

export function listarSnapshots(perfilId: string | null): CronogramaSnapshot[] {
  if (!perfilId) return [];
  return readRaw()
    .filter((s) => s.perfilId === perfilId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function snapshotMasReciente(perfilId: string | null): CronogramaSnapshot | null {
  const list = listarSnapshots(perfilId);
  return list[0] ?? null;
}

export type GuardarSnapshotInput = {
  perfilId: string;
  fechaInicioPlan: string | null | undefined;
  dias: number;
  modo: ModoCronograma;
  fuente: FuenteCronograma;
  mercadoActivoId: string | null;
  claveVariedad: string | null;
  diasPlan: DiaPlan[];
};

export function guardarSnapshotCronograma(input: GuardarSnapshotInput): CronogramaSnapshot | null {
  const createdAt = new Date().toISOString();
  const fallback = createdAt.slice(0, 10);
  const diasPlan = adjuntarFechasADias(input.diasPlan, input.fechaInicioPlan, fallback);
  const snap: CronogramaSnapshot = {
    id: crypto.randomUUID(),
    perfilId: input.perfilId,
    createdAt,
    fechaInicio: input.fechaInicioPlan && /^\d{4}-\d{2}-\d{2}$/.test(input.fechaInicioPlan) ? input.fechaInicioPlan : null,
    dias: input.dias,
    modo: input.modo,
    fuente: input.fuente,
    mercadoActivoId: input.mercadoActivoId,
    claveVariedad: input.claveVariedad,
    diasPlan
  };
  const all = readRaw().filter((s) => !(s.perfilId === input.perfilId && s.id === snap.id));
  all.push(snap);
  all.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  const trimmed = all.slice(-MAX_SNAPSHOTS);
  writeAll(trimmed);
  return snap;
}

export function stripFechaDia(d: DiaPlanConFecha): DiaPlan {
  const { fecha: _f, ...rest } = d;
  return rest;
}

/** Último snapshot (más reciente primero) que incluye esa fecha civil. */
export function buscarDiaEnSnapshots(perfilId: string | null, fecha: string): DiaPlanConFecha | null {
  if (!perfilId || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
  for (const s of listarSnapshots(perfilId)) {
    const hit = s.diasPlan.find((d) => d.fecha === fecha);
    if (hit) return hit;
  }
  return null;
}

/** Renombra un snapshot dado su id. Devuelve true si se encontró. */
export function renombrarSnapshot(id: string, titulo: string): boolean {
  const all = readRaw();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  all[idx] = { ...all[idx], titulo: titulo.trim() || undefined };
  writeAll(all);
  return true;
}

/** Elimina un snapshot por id. */
export function eliminarSnapshot(id: string): void {
  const all = readRaw().filter((s) => s.id !== id);
  writeAll(all);
}

/** Devuelve el id del snapshot marcado como "en uso" para el perfil. */
export function getSnapshotActivoId(perfilId: string | null): string | null {
  if (!perfilId) return null;
  return localStorage.getItem(activeSnapKey(perfilId));
}

/** Marca un snapshot como "en uso" (plan activo de la semana). */
export function setSnapshotActivoId(perfilId: string | null, id: string | null): void {
  if (!perfilId) return;
  if (!id) localStorage.removeItem(activeSnapKey(perfilId));
  else localStorage.setItem(activeSnapKey(perfilId), id);
  emitHistorial();
}

/** Elimina la clave "plan activo" de un perfil (al borrar persona). */
export function purgeSnapshotsDePerfil(perfilId: string): void {
  const all = readRaw().filter((s) => s.perfilId !== perfilId);
  writeAll(all);
  localStorage.removeItem(activeSnapKey(perfilId));
}
