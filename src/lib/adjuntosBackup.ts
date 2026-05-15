/** Serialización de registros IndexedDB para respaldo v2 (sin dependencias ZIP). */

import { MAX_RESPALDO_V2_TOTAL_BYTES } from "./mediaLimits";
import {
  type DiaAdjuntosRecord,
  type DiaAdjuntosMedia,
  type MediaSlot,
  type SeguimientoPlanDia,
  putDiaAdjuntosRecord,
  normalizeMediaSlot,
  ADJUNTOS_DIA_EVENT,
  ETIQUETAS_PROGRESO_DIA
} from "./diaAdjuntosIDB";

const DB_NAME = "tec_nutri_adjuntos_v1";
const STORE = "dias";

export type DiaAdjuntosMediaExport = {
  id: string;
  kind: "image" | "video";
  createdAt: string;
  slot: MediaSlot;
  remotePath?: string | null;
  mime: string;
  blobBase64: string;
  thumbBase64?: string;
};

export type DiaAdjuntosRecordExport = {
  key: string;
  progress: boolean[];
  medias: DiaAdjuntosMediaExport[];
  nota: string;
  seguimientoPlan: SeguimientoPlanDia | null;
};

function emitAdjuntosCambiados() {
  try {
    window.dispatchEvent(new CustomEvent(ADJUNTOS_DIA_EVENT, { detail: {} }));
  } catch {
    /* ignore */
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBlob(b64: string, mime: string): Blob {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function parseRecordRow(row: unknown): DiaAdjuntosRecord | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Partial<DiaAdjuntosRecord>;
  if (typeof r.key !== "string") return null;
  const progress = Array.isArray(r.progress) ? r.progress.map(Boolean).slice(0, ETIQUETAS_PROGRESO_DIA.length) : [];
  while (progress.length < ETIQUETAS_PROGRESO_DIA.length) progress.push(false);
  const medias: DiaAdjuntosMedia[] = [];
  if (Array.isArray(r.medias)) {
    for (const m of r.medias) {
      if (!m || typeof m !== "object") continue;
      const o = m as Partial<DiaAdjuntosMedia>;
      if (typeof o.id !== "string" || (o.kind !== "image" && o.kind !== "video")) continue;
      if (!(o.blob instanceof Blob)) continue;
      const thumbBlob = o.thumbBlob instanceof Blob ? o.thumbBlob : undefined;
      const rp = (o as { remotePath?: unknown }).remotePath;
      medias.push({
        id: o.id,
        kind: o.kind,
        blob: o.blob,
        thumbBlob,
        createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
        slot: normalizeMediaSlot((o as { slot?: unknown }).slot),
        remotePath: typeof rp === "string" && rp.length > 0 ? rp : null
      });
    }
  }
  const nota = typeof r.nota === "string" ? r.nota.slice(0, 2000) : "";
  const seg = r.seguimientoPlan;
  const seguimientoPlan: SeguimientoPlanDia | null =
    seg === "si" || seg === "parcial" || seg === "no" ? seg : null;
  return { key: r.key, progress, medias, nota, seguimientoPlan };
}

async function readAllRecords(): Promise<DiaAdjuntosRecord[]> {
  if (typeof indexedDB === "undefined") return [];
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => resolve([]);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.close();
        resolve([]);
        return;
      }
      const tx = db.transaction(STORE, "readonly");
      const r = tx.objectStore(STORE).getAll();
      r.onsuccess = () => {
        const rows = (r.result as unknown[]) ?? [];
        db.close();
        resolve(rows.map(parseRecordRow).filter(Boolean) as DiaAdjuntosRecord[]);
      };
      r.onerror = () => {
        db.close();
        resolve([]);
      };
    };
  });
}

async function clearAllRecords(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => resolve();
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.close();
        resolve();
        return;
      }
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    };
  });
}

/** Exporta todos los días con adjuntos; falla si el total supera el tope. */
export async function exportarAdjuntosParaRespaldo(): Promise<
  { ok: true; records: DiaAdjuntosRecordExport[] } | { ok: false; error: string }
> {
  const raw = await readAllRecords();
  const records: DiaAdjuntosRecordExport[] = [];
  let totalBytes = 0;

  for (const rec of raw) {
    const mediasOut: DiaAdjuntosMediaExport[] = [];
    for (const m of rec.medias) {
      totalBytes += m.blob.size;
      if (m.thumbBlob) totalBytes += m.thumbBlob.size;
      if (totalBytes > MAX_RESPALDO_V2_TOTAL_BYTES) {
        return {
          ok: false,
          error: `Los archivos del cronograma superan el límite de exportación (~${Math.round(MAX_RESPALDO_V2_TOTAL_BYTES / (1024 * 1024))} MB). Exporta solo JSON o borra vídeos muy grandes.`
        };
      }
      const mime = m.blob.type || (m.kind === "video" ? "video/mp4" : "image/jpeg");
      mediasOut.push({
        id: m.id,
        kind: m.kind,
        createdAt: m.createdAt,
        slot: m.slot,
        remotePath: m.remotePath ?? null,
        mime,
        blobBase64: await blobToBase64(m.blob),
        ...(m.thumbBlob ? { thumbBase64: await blobToBase64(m.thumbBlob) } : {})
      });
    }
    records.push({
      key: rec.key,
      progress: rec.progress,
      medias: mediasOut,
      nota: rec.nota,
      seguimientoPlan: rec.seguimientoPlan
    });
  }

  return { ok: true, records };
}

/** Restaura registros exportados (reemplaza el store completo). */
export async function importarAdjuntosDesdeRespaldo(records: DiaAdjuntosRecordExport[]): Promise<number> {
  await clearAllRecords();
  let n = 0;
  for (const ex of records) {
    if (typeof ex.key !== "string" || !Array.isArray(ex.medias)) continue;
    const medias: DiaAdjuntosMedia[] = [];
    for (const me of ex.medias) {
      if (typeof me.blobBase64 !== "string" || !me.blobBase64) continue;
      const mime = typeof me.mime === "string" ? me.mime : me.kind === "video" ? "video/mp4" : "image/jpeg";
      const blob = base64ToBlob(me.blobBase64, mime);
      let thumbBlob: Blob | undefined;
      if (me.thumbBase64) thumbBlob = base64ToBlob(me.thumbBase64, "image/jpeg");
      medias.push({
        id: typeof me.id === "string" ? me.id : crypto.randomUUID(),
        kind: me.kind === "video" ? "video" : "image",
        blob,
        thumbBlob,
        createdAt: typeof me.createdAt === "string" ? me.createdAt : new Date().toISOString(),
        slot: normalizeMediaSlot(me.slot),
        remotePath: typeof me.remotePath === "string" ? me.remotePath : null
      });
    }
    const progress = Array.isArray(ex.progress)
      ? ex.progress.map(Boolean).slice(0, ETIQUETAS_PROGRESO_DIA.length)
      : [];
    while (progress.length < ETIQUETAS_PROGRESO_DIA.length) progress.push(false);
    const seg = ex.seguimientoPlan;
    const seguimientoPlan: SeguimientoPlanDia | null =
      seg === "si" || seg === "parcial" || seg === "no" ? seg : null;
    const rec: DiaAdjuntosRecord = {
      key: ex.key,
      progress,
      medias,
      nota: typeof ex.nota === "string" ? ex.nota.slice(0, 2000) : "",
      seguimientoPlan
    };
    if (await putDiaAdjuntosRecord(rec)) n++;
  }
  emitAdjuntosCambiados();
  return n;
}
