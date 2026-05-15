import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL_IDS } from "./geminiModels";
import { urlReproducibleReceta } from "./recipeVideoUrl";
import { youtubeVideoIdFromInput } from "./youtubeEmbed";

const geminiKey = import.meta.env.VITE_GEMINI_API_KEY ?? "";
const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY ?? "";
const CACHE_KEY = "tec_nutri_salud_video_resolve_v1";
const MAX_CACHE = 120;

/** Instancias Invidious públicas (API de búsqueda sin clave; CORS variable). */
const INVIDIOUS_BASES = [
  "https://vid.puffyan.us",
  "https://inv.nadeko.net",
  "https://invidious.perennialte.ch"
];

type CacheMap = Record<string, string>;

function queryBusqueda(titulo: string, videoQuery?: string): string {
  return `${titulo.trim()} ${(videoQuery ?? "").trim()} receta español`
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
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

function getCached(q: string): string | null {
  const hit = readCache()[q];
  return hit ? urlReproducibleReceta(hit) : null;
}

function setCached(q: string, url: string) {
  const map = readCache();
  map[q] = url;
  writeCache(map);
}

async function searchYoutubeDataApi(q: string): Promise<string | null> {
  if (!youtubeApiKey) return null;
  try {
    const u = new URL("https://www.googleapis.com/youtube/v3/search");
    u.searchParams.set("part", "snippet");
    u.searchParams.set("type", "video");
    u.searchParams.set("maxResults", "5");
    u.searchParams.set("q", q);
    u.searchParams.set("relevanceLanguage", "es");
    u.searchParams.set("key", youtubeApiKey);
    const res = await fetch(u.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: Array<{ id?: { videoId?: string } }> };
    for (const it of data.items ?? []) {
      const id = it.id?.videoId;
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return `https://www.youtube.com/watch?v=${id}`;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

type InvidiousHit = { type?: string; videoId?: string };

async function searchInvidious(q: string): Promise<string | null> {
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
          return `https://www.youtube.com/watch?v=${id}`;
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

/** Gemini con Google Search: pide una URL real de tutorial en español. */
async function searchGeminiConGoogle(titulo: string, q: string): Promise<string | null> {
  if (!geminiKey) return null;
  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL_IDS[0]!,
      // @ts-expect-error googleSearch en runtime reciente del SDK
      tools: [{ googleSearch: {} }]
    });
    const prompt = `Busca en la web UN solo tutorial de cocina en español para preparar: "${titulo}".
Consulta de búsqueda: ${q}

Responde con UNA sola línea:
- URL completa https://www.youtube.com/watch?v=... o https://youtu.be/... si encuentras vídeo en YouTube, O
- URL https://www.tiktok.com/... o https://vimeo.com/... si es mejor en esa plataforma, O
- exactamente NULL si no hay enlace fiable.

No inventes IDs. No expliques nada más.`;
    const r = await model.generateContent(prompt);
    const text = r.response.text().trim();
    if (/^null$/i.test(text)) return null;
    const url = text.match(/https?:\/\/[^\s"'<>]+/)?.[0];
    if (!url) {
      const id = youtubeVideoIdFromInput(text);
      if (id) return `https://www.youtube.com/watch?v=${id}`;
      return null;
    }
    return urlReproducibleReceta(url);
  } catch {
    return null;
  }
}

/**
 * Busca y devuelve URL reproducible (prioridad: caché → YouTube API → Invidious → Gemini+Search).
 * Pensado para planes sin videoUrl guardado.
 */
export async function buscarVideoParaReceta(titulo: string, videoQuery?: string): Promise<string | null> {
  const q = queryBusqueda(titulo, videoQuery);
  if (!q) return null;

  const cached = getCached(q);
  if (cached) return cached;

  const orden = [
    () => searchYoutubeDataApi(q),
    () => searchInvidious(q),
    () => searchGeminiConGoogle(titulo, q)
  ];

  for (const fn of orden) {
    const url = await fn();
    const ok = url ? urlReproducibleReceta(url) : null;
    if (ok) {
      setCached(q, ok);
      return ok;
    }
  }
  return null;
}
