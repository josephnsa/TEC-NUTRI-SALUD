/**
 * Subida de evidencias a Supabase Storage (bucket privado `tec-nutri-media`).
 * Incluido en el plan gratuito de Supabase con límites de espacio del proyecto; sin coste extra de API propia.
 */

import { supabase } from "./supabase";

export const MEDIA_REMOTE_BUCKET = "tec-nutri-media";

function extForMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("gif")) return "gif";
  if (m.includes("webm")) return "webm";
  if (m.includes("quicktime") || m.includes("mov")) return "mov";
  if (m.includes("mp4")) return "mp4";
  if (m.startsWith("video/")) return "mp4";
  return "jpg";
}

/** Ruta del objeto: `{userId}/{perfilId}/{fecha}/{slot}-{mediaId}.{ext}` */
export function buildEvidenciaStoragePath(
  userId: string,
  perfilId: string,
  fechaIso: string,
  slot: string,
  mediaId: string,
  mime: string
): string {
  const ext = extForMime(mime);
  const safeSlot = slot.replace(/[^a-z0-9_-]/gi, "_").slice(0, 24);
  return `${userId}/${perfilId}/${fechaIso}/${safeSlot}-${mediaId}.${ext}`;
}

export async function subirEvidenciaBlob(
  userId: string,
  perfilId: string,
  fechaIso: string,
  slot: string,
  mediaId: string,
  blob: Blob,
  mime: string
): Promise<string | null> {
  if (!supabase) return null;
  const contentType = mime || blob.type || "application/octet-stream";
  const path = buildEvidenciaStoragePath(userId, perfilId, fechaIso, slot, mediaId, contentType);
  const { error } = await supabase.storage.from(MEDIA_REMOTE_BUCKET).upload(path, blob, {
    contentType,
    upsert: true
  });
  if (error) {
    console.warn("[mediaRemoteStorage] upload:", error.message);
    return null;
  }
  return path;
}

/** Elimina un objeto del bucket. No lanza error si el archivo no existe. */
export async function eliminarEvidenciaRemota(path: string): Promise<boolean> {
  if (!supabase || !path) return false;
  const { error } = await supabase.storage.from(MEDIA_REMOTE_BUCKET).remove([path]);
  if (error) {
    console.warn("[mediaRemoteStorage] remove:", error.message);
    return false;
  }
  return true;
}
