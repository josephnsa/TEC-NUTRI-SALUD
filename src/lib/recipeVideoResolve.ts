import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL_IDS } from "./geminiModels";
import { type VideoBusquedaContexto, textoBusquedaVideo, urlReproducibleReceta } from "./recipeVideoUrl";
import { primerVideoEmbebibleValido, validarVideoEmbebible } from "./videoEmbedValidate";
import { youtubeVideoIdFromInput } from "./youtubeEmbed";

const geminiKey = import.meta.env.VITE_GEMINI_API_KEY ?? "";
const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY ?? "";
const CACHE_KEY = "tec_nutri_salud_video_resolve_v2";
const MAX_CACHE = 120;
const EN_NAVEGADOR = typeof window !== "undefined";

const INVIDIOUS_BASES = [
  "https://vid.puffyan.us",
  "https://inv.nadeko.net",
  "https://invidious.perennialte.ch"
];

type CacheMap = Record<string, string>;

function queryBusqueda(
  titulo: string,
  videoQuery?: string,
  contexto: VideoBusquedaContexto = "receta"
): string {
  return textoBusquedaVideo(titulo, videoQuery, contexto).slice(0, 180);
}

function readCache(): CacheMap {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as unknown;
    return o && typeof o === "object" ? (o as CacheMap) : {};
  } catch {
    return {};
  }
}

function writeCache(map: CacheMap) {
  const keys = Object.keys(map);
  const trimmed =
    keys.length <= MAX_CACHE
      ? map
      : Object.fromEntries(keys.slice(-MAX_CACHE).map((k) => [k, map[k]!]));
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota */
  }
}

function setCached(q: string, url: string) {
  const map = readCache();
  map[q] = url;
  writeCache(map);
}

function removeCached(q: string) {
  const map = readCache();
  delete map[q];
  writeCache(map);
}

async function searchYoutubeDataApiCandidates(q: string): Promise<string[]> {
  if (!youtubeApiKey) return [];
  try {
    const u = new URL("https://www.googleapis.com/youtube/v3/search");
    u.searchParams.set("part", "snippet");
    u.searchParams.set("type", "video");
    u.searchParams.set("maxResults", "6");
    u.searchParams.set("q", q);
    u.searchParams.set("relevanceLanguage", "es");
    u.searchParams.set("videoEmbeddable", "true");
    u.searchParams.set("key", youtubeApiKey);
    const res = await fetch(u.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: Array<{ id?: { videoId?: string } }> };
    const out: string[] = [];
    for (const it of data.items ?? []) {
      const id = it.id?.videoId;
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        out.push(`https://www.youtube.com/watch?v=${id}`);
      }
    }
    return out;
  } catch {
    return [];
  }
}

type InvidiousHit = { type?: string; videoId?: string };

/** Invidious no tiene CORS en GitHub Pages; solo usar fuera del navegador. */
async function searchInvidiousCandidates(q: string): Promise<string[]> {
  if (EN_NAVEGADOR) return [];
  const out: string[] = [];
  for (const base of INVIDIOUS_BASES) {
    try {
      const u = `${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video`;
      const res = await fetch(u, { signal: AbortSignal.timeout(7000) });
      if (!res.ok) continue;
      const data = (await res.json()) as InvidiousHit[];
      if (!Array.isArray(data)) continue;
      for (const row of data) {
        if (row.type !== "video" || !row.videoId) continue;
        const id = String(row.videoId).trim();
        if (/^[a-zA-Z0-9_-]{11}$/.test(id)) {
          out.push(`https://www.youtube.com/watch?v=${id}`);
        }
      }
      if (out.length >= 4) return out.slice(0, 6);
    } catch {
      continue;
    }
  }
  return out;
}

async function searchGeminiConGoogle(
  titulo: string,
  q: string,
  contexto: VideoBusquedaContexto
): Promise<string | null> {
  if (!geminiKey) return null;
  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL_IDS[0]!,
      // @ts-expect-error googleSearch tool
      tools: [{ googleSearch: {} }]
    });
    const tema =
      contexto === "belleza"
        ? "belleza / cuidado personal / cabello"
        : "cocina / receta";
    const prompt = `Busca UN tutorial de ${tema} en español para: "${titulo}" (${q}).
Responde SOLO una URL https de YouTube, TikTok o Vimeo que exista hoy y permita embed, o NULL si no hay certeza.`;
    const r = await model.generateContent(prompt);
    const text = r.response.text().trim();
    if (/^null$/i.test(text)) return null;
    const url = text.match(/https?:\/\/[^\s"'<>]+/)?.[0];
    if (url) return urlReproducibleReceta(url);
    const id = youtubeVideoIdFromInput(text);
    return id ? `https://www.youtube.com/watch?v=${id}` : null;
  } catch (e: unknown) {
    if (esErrorCuotaGemini(e)) throw e;
    return null;
  }
}

function esErrorCuotaGemini(e: unknown): boolean {
  const msg = String(e instanceof Error ? e.message : e);
  return /429|quota|RESOURCE_EXHAUSTED|Too Many Requests/i.test(msg);
}

/** Qué fuentes de búsqueda están activas en este build (para mensajes en UI). */
export function fuentesBusquedaVideo(): { youtubeApi: boolean; gemini: boolean } {
  return {
    youtubeApi: Boolean(youtubeApiKey),
    gemini: Boolean(geminiKey)
  };
}

/**
 * Busca vídeo real, valida embed y devuelve URL reproducible en la PWA.
 */
export async function buscarVideoEmbeddible(
  titulo: string,
  videoQuery?: string,
  contexto: VideoBusquedaContexto = "receta"
): Promise<string | null> {
  const q = queryBusqueda(titulo, videoQuery, contexto);
  if (!q) return null;

  const cached = readCache()[q];
  if (cached) {
    const ok = urlReproducibleReceta(cached);
    if (ok && (await validarVideoEmbebible(ok))) return ok;
    removeCached(q);
  }

  const candidatos: string[] = [];
  candidatos.push(...(await searchYoutubeDataApiCandidates(q)));
  try {
    const gem = await searchGeminiConGoogle(titulo, q, contexto);
    if (gem) candidatos.push(gem);
  } catch (e) {
    if (!esErrorCuotaGemini(e)) throw e;
    // Cuota Gemini agotada: seguir con candidatos de YouTube Data API (u otras fuentes).
  }
  candidatos.push(...(await searchInvidiousCandidates(q)));

  const unicos = [...new Set(candidatos)];
  const valido = await primerVideoEmbebibleValido(unicos);
  if (valido) setCached(q, valido);
  return valido;
}

/** Búsqueda de vídeo para recetas del cronograma. */
export async function buscarVideoParaReceta(titulo: string, videoQuery?: string): Promise<string | null> {
  return buscarVideoEmbeddible(titulo, videoQuery, "receta");
}

/** Búsqueda de vídeo para tips de belleza. */
export async function buscarVideoParaBelleza(titulo: string, videoQuery?: string): Promise<string | null> {
  return buscarVideoEmbeddible(titulo, videoQuery, "belleza");
}

/** Valida URL ya conocida (p. ej. guardada en el plan). */
export async function asegurarVideoEmbebible(playUrl: string): Promise<string | null> {
  const url = urlReproducibleReceta(playUrl);
  if (!url) return null;
  if (await validarVideoEmbebible(url)) return url;
  return null;
}
