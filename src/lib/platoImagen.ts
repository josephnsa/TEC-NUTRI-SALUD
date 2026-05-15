import type { PlatoReceta } from "./nutritionPlan";
import { urlReproducibleDesdePlato } from "./recipeVideoUrl";
import { youtubeThumbnailUrl, youtubeVideoIdFromInput } from "./youtubeEmbed";

/** URL de miniatura YouTube si el plato tiene vídeo. */
export function miniaturaYoutubeDesdePlato(
  plato: Pick<PlatoReceta, "videoUrl" | "youtubeVideoId">
): string | null {
  const play = urlReproducibleDesdePlato(plato);
  const id =
    youtubeVideoIdFromInput(play ?? "") ??
    (plato.youtubeVideoId && /^[a-zA-Z0-9_-]{11}$/.test(plato.youtubeVideoId)
      ? plato.youtubeVideoId
      : null);
  return id ? youtubeThumbnailUrl(id) : null;
}

/** Busca imagen representativa del plato (TheMealDB, sin clave). */
async function buscarImagenTheMealDb(titulo: string): Promise<string | null> {
  const q = titulo.trim().split(/\s+/).slice(0, 4).join(" ");
  if (!q) return null;
  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { meals?: Array<{ strMealThumb?: string }> | null };
    const thumb = data.meals?.[0]?.strMealThumb;
    return typeof thumb === "string" && thumb.startsWith("http") ? thumb : null;
  } catch {
    return null;
  }
}

/** Comprueba que la URL de imagen carga (evita huecos rotos en PDF). */
export function imagenUrlCarga(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const t = window.setTimeout(() => resolve(false), 5000);
    img.onload = () => {
      window.clearTimeout(t);
      resolve(img.naturalWidth > 40);
    };
    img.onerror = () => {
      window.clearTimeout(t);
      resolve(false);
    };
    img.src = url;
  });
}

/** Imagen para PDF / export: miniatura del vídeo o búsqueda TheMealDB. */
export async function imagenUrlParaPlato(
  plato: Pick<PlatoReceta, "titulo" | "videoUrl" | "youtubeVideoId">
): Promise<string | null> {
  const yt = miniaturaYoutubeDesdePlato(plato);
  if (yt && (await imagenUrlCarga(yt))) return yt;

  const meal = await buscarImagenTheMealDb(plato.titulo);
  if (meal && (await imagenUrlCarga(meal))) return meal;

  return yt ?? meal;
}
