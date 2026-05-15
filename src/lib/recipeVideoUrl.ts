import type { PlatoReceta } from "./nutritionPlan";
import { youtubeVideoIdFromInput } from "./youtubeEmbed";

export type RecipeVideoPlatform =
  | "youtube"
  | "tiktok"
  | "vimeo"
  | "facebook"
  | "instagram"
  | "file"
  | "unknown";

const PLATFORM_LABELS: Record<RecipeVideoPlatform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  vimeo: "Vimeo",
  facebook: "Facebook",
  instagram: "Instagram",
  file: "Vídeo",
  unknown: "Web"
};

/** Detecta plataforma a partir de una URL o id YouTube. */
export function detectRecipeVideoPlatform(raw: string): RecipeVideoPlatform {
  const s = raw.trim().toLowerCase();
  if (!s) return "unknown";
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return "youtube";
  if (s.includes("youtube.com") || s.includes("youtu.be")) return "youtube";
  if (s.includes("tiktok.com")) return "tiktok";
  if (s.includes("vimeo.com")) return "vimeo";
  if (s.includes("facebook.com") || s.includes("fb.watch")) return "facebook";
  if (s.includes("instagram.com")) return "instagram";
  if (/\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(s)) return "file";
  return "unknown";
}

export function etiquetaPlataformaVideo(platform: RecipeVideoPlatform): string {
  return PLATFORM_LABELS[platform] ?? "Web";
}

/**
 * Normaliza entrada (URL completa, ID YouTube u otro) a URL reproducible por react-player.
 */
export function urlReproducibleReceta(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  const ytFromId = youtubeVideoIdFromInput(s);
  if (ytFromId && (s.length === 11 || !s.includes("http"))) {
    return `https://www.youtube.com/watch?v=${ytFromId}`;
  }

  if (!/^https?:\/\//i.test(s)) return null;

  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "");
    const allowed =
      host.includes("youtube.com") ||
      host === "youtu.be" ||
      host.includes("tiktok.com") ||
      host.includes("vimeo.com") ||
      host.includes("facebook.com") ||
      host.includes("fb.watch") ||
      host.includes("instagram.com") ||
      /\.(mp4|webm|ogg|m3u8)$/i.test(u.pathname);

    if (allowed) return u.href;
  } catch {
    return null;
  }
  return null;
}

/** URL lista para el reproductor a partir del plato guardado. */
export function urlReproducibleDesdePlato(
  plato: Pick<PlatoReceta, "videoUrl" | "youtubeVideoId">
): string | null {
  const fromUrl = plato.videoUrl ? urlReproducibleReceta(plato.videoUrl) : null;
  if (fromUrl) return fromUrl;
  const id = String(plato.youtubeVideoId ?? "").trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return `https://www.youtube.com/watch?v=${id}`;
  }
  return null;
}

export type VideoBusquedaContexto = "receta" | "belleza";

const SUFIJO_BUSQUEDA_VIDEO: Record<VideoBusquedaContexto, string> = {
  receta: "receta español",
  belleza: "belleza natural español"
};

/** Texto de búsqueda para YouTube / caché (cronograma, belleza, etc.). */
export function textoBusquedaVideo(
  titulo: string,
  videoQuery?: string,
  contexto: VideoBusquedaContexto = "receta"
): string {
  return `${titulo.trim()} ${(videoQuery ?? "").trim()} ${SUFIJO_BUSQUEDA_VIDEO[contexto]}`
    .replace(/\s+/g, " ")
    .trim();
}

/** Enlace de búsqueda multi-plataforma (prioriza YouTube; usuario puede cambiar en el buscador). */
export function busquedaVideoHref(
  titulo: string,
  videoQuery?: string,
  contexto: VideoBusquedaContexto = "receta"
): string {
  const q = textoBusquedaVideo(titulo, videoQuery, contexto);
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

/** @deprecated Usa busquedaVideoHref */
export function busquedaVideoRecetaHref(titulo: string, videoQuery?: string): string {
  return busquedaVideoHref(titulo, videoQuery, "receta");
}
