import { detectRecipeVideoPlatform, urlReproducibleReceta } from "./recipeVideoUrl";
import { youtubeOembedDisponible, youtubeVideoIdFromInput, youtubeVideoVerificado } from "./youtubeEmbed";

/** Comprueba con noembed que la URL admite iframe embebido. */
async function validarConNoembed(watchUrl: string): Promise<boolean> {
  try {
    const u = `https://noembed.com/embed?format=json&url=${encodeURIComponent(watchUrl)}`;
    const res = await fetch(u, { signal: AbortSignal.timeout(5500) });
    if (!res.ok) return false;
    const data = (await res.json()) as { error?: string; html?: string };
    if (data.error) return false;
    return typeof data.html === "string" && data.html.length > 20;
  } catch {
    return false;
  }
}

/**
 * Valida que un vídeo exista y sea embebible en la PWA (oEmbed / noembed).
 * Usar antes de guardar en caché o mostrar el reproductor.
 */
export async function validarVideoEmbebible(playUrl: string): Promise<boolean> {
  const url = urlReproducibleReceta(playUrl);
  if (!url) return false;

  const platform = detectRecipeVideoPlatform(url);

  if (platform === "youtube") {
    const id = youtubeVideoIdFromInput(url);
    if (!id) return false;
    // En navegador: oEmbed basta (miniatura + noembed fallan a menudo y bloquean el player).
    const base =
      typeof window !== "undefined"
        ? await youtubeOembedDisponible(id)
        : await youtubeVideoVerificado(id);
    if (!base) return false;
    if (typeof window !== "undefined") return true;
    return validarConNoembed(url);
  }

  if (platform === "vimeo" || platform === "tiktok" || platform === "facebook") {
    return validarConNoembed(url);
  }

  if (platform === "file") {
    try {
      const head = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
      return head.ok;
    } catch {
      return false;
    }
  }

  return validarConNoembed(url);
}

/** Prueba candidatos en orden hasta encontrar uno embebible. */
export async function primerVideoEmbebibleValido(candidatos: string[]): Promise<string | null> {
  for (const raw of candidatos) {
    const url = urlReproducibleReceta(raw);
    if (!url) continue;
    /* eslint-disable no-await-in-loop */
    if (await validarVideoEmbebible(url)) return url;
    /* eslint-enable no-await-in-loop */
  }
  return null;
}
