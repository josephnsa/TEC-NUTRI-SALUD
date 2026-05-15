/** Límites orientativos para adjuntos del cronograma (dispositivo y nube). */

/** Máximo por archivo en IndexedDB (dispositivo). */
export const MAX_ADJUNTO_LOCAL_BYTES = 50 * 1024 * 1024;

/** Imágenes en dispositivo (evita fotos RAW enormes). */
export const MAX_IMAGEN_LOCAL_BYTES = 12 * 1024 * 1024;

/** Alineado con `file_size_limit` del bucket `tec-nutri-media` en `supabase/schema.sql`. */
export const MAX_ADJUNTO_REMOTO_BYTES = 50 * 1024 * 1024;

/** Tope recomendado al exportar respaldo v2 con medios en base64. */
export const MAX_RESPALDO_V2_TOTAL_BYTES = 120 * 1024 * 1024;

function mb(n: number): string {
  return `${Math.round(n / (1024 * 1024))} MB`;
}

export function validarArchivoAdjunto(
  file: File
): { ok: true } | { ok: false; mensaje: string } {
  const esVideo = file.type.startsWith("video/");
  const esImagen = file.type.startsWith("image/");
  if (!esVideo && !esImagen) {
    return { ok: false, mensaje: "Solo se admiten imágenes o vídeos." };
  }
  const max = esVideo ? MAX_ADJUNTO_LOCAL_BYTES : MAX_IMAGEN_LOCAL_BYTES;
  if (file.size > max) {
    return {
      ok: false,
      mensaje: `El archivo supera ${mb(max)} (${mb(file.size)}). Reduce tamaño o duración e inténtalo de nuevo.`
    };
  }
  return { ok: true };
}

export function mensajeLimitesAdjuntos(): string {
  return `En este dispositivo: imágenes hasta ${mb(MAX_IMAGEN_LOCAL_BYTES)}, vídeos hasta ${mb(MAX_ADJUNTO_LOCAL_BYTES)}. Con cuenta, la copia en nube respeta hasta ${mb(MAX_ADJUNTO_REMOTO_BYTES)} por archivo.`;
}
