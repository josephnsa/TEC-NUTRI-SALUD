/** Adjuntos y progreso del día (fase 2.5b), por perfil + fecha YYYY-MM-DD. */

import { blobImageThumbnail } from "./imageThumb";

const DB_NAME = "tec_nutri_adjuntos_v1";
const DB_VERSION = 1;
const STORE = "dias";

export const ADJUNTOS_DIA_EVENT = "tec-nutri-salud-adjuntos-dia";

function emitAdjuntosCambiados() {
  try {
    window.dispatchEvent(new CustomEvent(ADJUNTOS_DIA_EVENT, { detail: {} }));
  } catch {
    /* ignore */
  }
}

export const ETIQUETAS_PROGRESO_DIA = [
  "Desayuno cumplido",
  "Almuerzo cumplido",
  "Cena cumplido",
  "Hidratación (agua)",
  "Actividad o movimiento",
  "Descanso (sueño)"
] as const;

export type MediaSlot = "desayuno" | "almuerzo" | "cena" | "general";

export const MEDIA_SLOT_LABEL: Record<MediaSlot, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  cena: "Cena",
  general: "Todo el día"
};

export const SLOTS_ORDEN_MEDIA: MediaSlot[] = ["desayuno", "almuerzo", "cena", "general"];

export function normalizeMediaSlot(s: unknown): MediaSlot {
  if (s === "desayuno" || s === "almuerzo" || s === "cena" || s === "general") return s;
  return "general";
}

export type DiaAdjuntosMedia = {
  id: string;
  kind: "image" | "video";
  blob: Blob;
  /** JPEG reducido solo para imágenes; el detalle usa `blob`. */
  thumbBlob?: Blob;
  createdAt: string;
  /** Comida a la que asignas la evidencia; legacy sin valor = `general`. */
  slot: MediaSlot;
  /** Ruta en bucket `tec-nutri-media` (prefijo `userId/…`), si ya se subió a Supabase. */
  remotePath?: string | null;
};

export type SeguimientoPlanDia = "si" | "parcial" | "no";

export type DiaAdjuntosRecord = {
  key: string;
  progress: boolean[];
  medias: DiaAdjuntosMedia[];
  /** Nota libre del usuario (no clínica). */
  nota: string;
  /** ¿Seguiste el plan de comidas hoy? */
  seguimientoPlan: SeguimientoPlanDia | null;
};

const PROGRESS_LEN = ETIQUETAS_PROGRESO_DIA.length;

function defaultProgress(): boolean[] {
  return Array.from({ length: PROGRESS_LEN }, () => false);
}

function recordKey(perfilId: string, fechaIso: string) {
  return `${perfilId}__${fechaIso}`;
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type ResumenAdjuntoDia = {
  nImg: number;
  nVideo: number;
  /** Hay nota, seguimiento o progreso marcado (sin contar solo plan). */
  tieneRegistroExtra: boolean;
  /** Primera imagen: miniatura si existe, si no el blob original. */
  thumbPreview: Blob | null;
};

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => resolve(null);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "key" });
        }
      };
    });
  }
  return dbPromise;
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getDiaAdjuntosRecord(perfilId: string, fechaIso: string): Promise<DiaAdjuntosRecord | null> {
  const db = await openDb();
  if (!db) return null;
  try {
    const tx = db.transaction(STORE, "readonly");
    const row = await reqToPromise(tx.objectStore(STORE).get(recordKey(perfilId, fechaIso)));
    if (!row || typeof row !== "object") return null;
    const r = row as Partial<DiaAdjuntosRecord>;
    if (r.key !== recordKey(perfilId, fechaIso)) return null;
    const progress = Array.isArray(r.progress) ? r.progress.map(Boolean).slice(0, PROGRESS_LEN) : [];
    while (progress.length < PROGRESS_LEN) progress.push(false);
    const medias: DiaAdjuntosMedia[] = [];
    if (Array.isArray(r.medias)) {
      for (const m of r.medias) {
        if (!m || typeof m !== "object") continue;
        const o = m as Partial<DiaAdjuntosMedia>;
        if (typeof o.id !== "string" || (o.kind !== "image" && o.kind !== "video")) continue;
        if (!(o.blob instanceof Blob)) continue;
        const thumbBlob = o.thumbBlob instanceof Blob ? o.thumbBlob : undefined;
        const rp = (o as { remotePath?: unknown }).remotePath;
        const remotePath = typeof rp === "string" && rp.length > 0 ? rp : null;
        medias.push({
          id: o.id,
          kind: o.kind,
          blob: o.blob,
          thumbBlob,
          createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
          slot: normalizeMediaSlot((o as { slot?: unknown }).slot),
          remotePath
        });
      }
    }
    const nota = typeof r.nota === "string" ? r.nota.slice(0, 2000) : "";
    const seg = r.seguimientoPlan;
    const seguimientoPlan: SeguimientoPlanDia | null =
      seg === "si" || seg === "parcial" || seg === "no" ? seg : null;
    return { key: r.key!, progress, medias, nota, seguimientoPlan };
  } catch {
    return null;
  }
}

export async function putDiaAdjuntosRecord(rec: DiaAdjuntosRecord): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  try {
    const tx = db.transaction(STORE, "readwrite");
    await reqToPromise(tx.objectStore(STORE).put(rec));
    return true;
  } catch {
    return false;
  }
}

export async function ensureDiaRecord(perfilId: string, fechaIso: string): Promise<DiaAdjuntosRecord> {
  const ex = await getDiaAdjuntosRecord(perfilId, fechaIso);
  if (ex) return ex;
  const rec: DiaAdjuntosRecord = {
    key: recordKey(perfilId, fechaIso),
    progress: defaultProgress(),
    medias: [],
    nota: "",
    seguimientoPlan: null
  };
  await putDiaAdjuntosRecord(rec);
  return rec;
}

export async function updateDiaProgress(perfilId: string, fechaIso: string, progress: boolean[]): Promise<boolean> {
  const rec = await ensureDiaRecord(perfilId, fechaIso);
  const next = progress.slice(0, PROGRESS_LEN);
  while (next.length < PROGRESS_LEN) next.push(false);
  rec.progress = next;
  const ok = await putDiaAdjuntosRecord(rec);
  if (ok) emitAdjuntosCambiados();
  return ok;
}

/**
 * Agrega un archivo al registro del día.
 * @returns El ID del nuevo media si se guardó correctamente, `null` en caso de error.
 */
export async function addDiaMedia(
  perfilId: string,
  fechaIso: string,
  file: File,
  slot: MediaSlot = "general"
): Promise<string | null> {
  const rec = await ensureDiaRecord(perfilId, fechaIso);
  const kind: DiaAdjuntosMedia["kind"] = file.type.startsWith("video/") ? "video" : "image";
  let thumbBlob: Blob | undefined;
  if (kind === "image") {
    thumbBlob = (await blobImageThumbnail(file)) ?? undefined;
  }
  const newId = crypto.randomUUID();
  rec.medias.push({
    id: newId,
    kind,
    blob: file,
    thumbBlob,
    createdAt: new Date().toISOString(),
    slot: normalizeMediaSlot(slot)
  });
  const ok = await putDiaAdjuntosRecord(rec);
  if (ok) emitAdjuntosCambiados();
  return ok ? newId : null;
}

export async function removeDiaMedia(perfilId: string, fechaIso: string, mediaId: string): Promise<boolean> {
  const rec = await getDiaAdjuntosRecord(perfilId, fechaIso);
  if (!rec) return true;
  rec.medias = rec.medias.filter((m) => m.id !== mediaId);
  const ok = await putDiaAdjuntosRecord(rec);
  if (ok) emitAdjuntosCambiados();
  return ok;
}

export async function setDiaMediaRemotePath(
  perfilId: string,
  fechaIso: string,
  mediaId: string,
  remotePath: string
): Promise<boolean> {
  const rec = await getDiaAdjuntosRecord(perfilId, fechaIso);
  if (!rec) return false;
  const m = rec.medias.find((x) => x.id === mediaId);
  if (!m) return false;
  m.remotePath = remotePath;
  const ok = await putDiaAdjuntosRecord(rec);
  if (ok) emitAdjuntosCambiados();
  return ok;
}

export async function updateDiaMeta(
  perfilId: string,
  fechaIso: string,
  patch: { nota?: string; seguimientoPlan?: SeguimientoPlanDia | null }
): Promise<boolean> {
  const rec = await ensureDiaRecord(perfilId, fechaIso);
  if (patch.nota !== undefined) rec.nota = patch.nota.slice(0, 2000);
  if (patch.seguimientoPlan !== undefined) rec.seguimientoPlan = patch.seguimientoPlan;
  const ok = await putDiaAdjuntosRecord(rec);
  if (ok) emitAdjuntosCambiados();
  return ok;
}

/** Resumen de adjuntos/registro por fecha en un mes (una lectura getAll). */
export async function listResumenAdjuntosMes(
  perfilId: string,
  year: number,
  monthIndex: number
): Promise<Map<string, ResumenAdjuntoDia>> {
  const db = await openDb();
  const out = new Map<string, ResumenAdjuntoDia>();
  if (!db) return out;
  const desde = toYmd(new Date(year, monthIndex, 1));
  const hasta = toYmd(new Date(year, monthIndex + 1, 0));
  const prefix = `${perfilId}__`;
  try {
    const rows = await new Promise<unknown[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const r = tx.objectStore(STORE).getAll();
      r.onsuccess = () => resolve((r.result as unknown[]) ?? []);
      r.onerror = () => reject(r.error);
    });
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const rec = row as Partial<DiaAdjuntosRecord>;
      if (typeof rec.key !== "string" || !rec.key.startsWith(prefix)) continue;
      const fecha = rec.key.slice(prefix.length);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha < desde || fecha > hasta) continue;
      const medias = Array.isArray(rec.medias) ? rec.medias : [];
      let nImg = 0;
      let nVideo = 0;
      let thumbPreview: Blob | null = null;
      for (const m of medias) {
        if (!m || typeof m !== "object") continue;
        const k = (m as { kind?: string }).kind;
        if (k === "image") {
          nImg++;
          if (!thumbPreview) {
            const tb = (m as { thumbBlob?: Blob }).thumbBlob;
            const blob = (m as { blob?: Blob }).blob;
            thumbPreview = tb instanceof Blob ? tb : blob instanceof Blob ? blob : null;
          }
        } else if (k === "video") nVideo++;
      }
      const progress = Array.isArray(rec.progress) ? rec.progress : [];
      const progOk = progress.some(Boolean);
      const nota = typeof rec.nota === "string" ? rec.nota.trim() : "";
      const seg = rec.seguimientoPlan;
      const segOk = seg === "si" || seg === "parcial" || seg === "no";
      const tieneRegistroExtra = progOk || Boolean(nota) || segOk;
      if (nImg || nVideo || tieneRegistroExtra) {
        out.set(fecha, { nImg, nVideo, tieneRegistroExtra, thumbPreview });
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

/** Conteo global de días con registro adjunto y totales de medios (todos los perfiles). */
export async function contarAdjuntosGlobal(): Promise<{
  diasConDatos: number;
  nImg: number;
  nVideo: number;
}> {
  const db = await openDb();
  const empty = { diasConDatos: 0, nImg: 0, nVideo: 0 };
  if (!db) return empty;
  try {
    const rows = await new Promise<unknown[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const r = tx.objectStore(STORE).getAll();
      r.onsuccess = () => resolve((r.result as unknown[]) ?? []);
      r.onerror = () => reject(r.error);
    });
    let diasConDatos = 0;
    let nImg = 0;
    let nVideo = 0;
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const rec = row as Partial<DiaAdjuntosRecord>;
      const medias = Array.isArray(rec.medias) ? rec.medias : [];
      let rowImg = 0;
      let rowVideo = 0;
      for (const m of medias) {
        if (!m || typeof m !== "object") continue;
        const k = (m as { kind?: string }).kind;
        if (k === "image") rowImg++;
        else if (k === "video") rowVideo++;
      }
      const progress = Array.isArray(rec.progress) ? rec.progress : [];
      const progOk = progress.some(Boolean);
      const nota = typeof rec.nota === "string" ? rec.nota.trim() : "";
      const seg = rec.seguimientoPlan;
      const segOk = seg === "si" || seg === "parcial" || seg === "no";
      const tieneRegistroExtra = progOk || Boolean(nota) || segOk;
      if (rowImg || rowVideo || tieneRegistroExtra) {
        diasConDatos++;
        nImg += rowImg;
        nVideo += rowVideo;
      }
    }
    return { diasConDatos, nImg, nVideo };
  } catch {
    return empty;
  }
}
