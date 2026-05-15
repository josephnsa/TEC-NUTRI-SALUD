import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ListaItem } from "./ketoMercado";
import type { DiaPlan, ModoCronograma, PerfilUsuario, PlatoReceta } from "./nutritionPlan";
import { GEMINI_MODEL_IDS } from "./geminiModels";
import { URL_GOOGLE_AI_STUDIO_API_KEY } from "./googleAiStudio";
import { miniaturaYoutubeCarga, youtubeVideoIdFromInput } from "./youtubeEmbed";

export { URL_GOOGLE_AI_STUDIO_API_KEY } from "./googleAiStudio";

const key = import.meta.env.VITE_GEMINI_API_KEY ?? "";
const CHUNK_DIAS = 10;

export function geminiRecetasDisponible(): boolean {
  return Boolean(key);
}

/** Misma clave gratuita de Google AI Studio que el asistente (Agente): recetas en el navegador sin backend propio. */
export function agenteRecetasGratisDisponible(): boolean {
  return geminiRecetasDisponible();
}

function listaMercadoLinea(it: ListaItem): string {
  const nm = (it.nombreCustom?.trim() || it.nombre).trim();
  return `${nm} · ${it.cantidad} ${it.unidad}${it.comprado ? " ✓ comprado" : ""}${
    it.origen === "manual" ? " [despensa manual]" : ""
  }`;
}

/** Lista completa para la IA — siempre con cantidades/unidad del usuario. */
function textoListaMercadoCompleta(items: ListaItem[] | undefined): string {
  if (!items?.length) {
    return "(No hay lista de mercado cargada para este perfil. El usuario debe ir a Mercado keto y/o marcar ítems.)";
  }
  return items.map(listaMercadoLinea).join("\n");
}

function textoComprados(items: ListaItem[] | undefined): string {
  if (!items?.length) return "(sin ítems en la lista)";
  const líneas = items.filter((i) => i.comprado).map(listaMercadoLinea);
  return líneas.length ? líneas.join("\n") : "(ningún ítem marcado como comprado aún)";
}

function instruccionMercadoPorModo(modo: ModoCronograma, hayComprados: boolean): string {
  switch (modo) {
    case "mercado":
      return hayComprados
        ? "Usa CASI EXCLUSIVAMENTE los ítems **marcados comprados** y sus cantidades/días de compra como base de ingredientes. Si algo vital falta entre comprados, nombra un sustituto mínimo keto/saludable."
        : "No hay comprados marcados: usa LA LISTA ENTERA siguiente como despensa objetivo con sus cantidades; reparte uso razonable a lo largo de los días.";
    case "mixto":
      return hayComprados
        ? "Combina perfil + mercado: prioriza ítems **comprados** y sus cantidades; del resto de la lista puede completar sólo cuando enriquece el plan."
        : "Combina perfil + lista completa de mercado: usa esa lista como referencia fuerte de qué tienen en casa (cantidades disponibles); no necesitas esperar marca 'comprado'.";
    case "perfil":
    default:
      return hayComprados
        ? "Modo sólo perfil pero hay mercado disponible: trata ítems **comprados** como despensa muy probable; mención en recetas usando cantidades cercanas cuando encaje."
        : "Hay lista de mercado (aun sin marcar comprados): teórico 'despensa con cantidades' — distribuye esos ingredientes en las recetas de forma plausible respetando el estilo.";
  }
}

/** Refuerza la consulta de YouTube para que incluya el nombre del plato si la IA omitió parte del título. */
function alinearVideoQuery(titulo: string, videoQuery: string): string {
  const t = titulo.trim();
  const v = (videoQuery || "").trim();
  if (!v) return `${t} receta paso a paso`;
  const primer = t.split(/\s+/)[0]?.toLowerCase() ?? "";
  if (primer.length >= 4 && v.toLowerCase().includes(primer)) return v;
  return `${t} ${v}`.replace(/\s+/g, " ").trim();
}

function numOrUndef(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : undefined;
}

function normalizeSlot(x: unknown): PlatoReceta {
  if (!x || typeof x !== "object") {
    return {
      titulo: "Comida sugerida",
      receta: "Ingredientes (1 porción): a tu gusto según despensa. · Pasos: combina y cocina con lo disponible.",
      videoQuery: "receta saludable casera español"
    };
  }
  const o = x as Record<string, unknown>;
  const titulo = String(o.titulo ?? "Plato").trim() || "Plato";
  const receta =
    String(o.receta ?? "").trim() ||
    "Ingredientes (1 porción): ver despensa. · Pasos: preparar al gusto respetando tu estilo de dieta.";
  const videoRaw = String(o.videoQuery ?? "").trim();
  const videoQuery = alinearVideoQuery(titulo, videoRaw || titulo);
  const ytField = o.youtube_video_id != null ? String(o.youtube_video_id).trim() : "";
  const fromField = ytField.length === 11 && /^[a-zA-Z0-9_-]+$/.test(ytField) ? ytField : null;
  const youtubeVideoId =
    fromField ??
    youtubeVideoIdFromInput(videoRaw) ??
    youtubeVideoIdFromInput(String(o.embedUrl ?? "")) ??
    youtubeVideoIdFromInput(receta) ??
    youtubeVideoIdFromInput(titulo);
  const kcal_estimate = numOrUndef(o.kcal_estimate);
  const protein_g = numOrUndef(o.protein_g);
  const fat_g = numOrUndef(o.fat_g);
  const carb_g = numOrUndef(o.carb_g);
  const fiber_g = numOrUndef(o.fiber_g);
  const porcionesRaw = typeof o.porciones === "number" ? o.porciones : Number(o.porciones);
  let porciones: number | undefined;
  if (Number.isFinite(porcionesRaw)) {
    const r = Math.round(Number(porcionesRaw));
    if (r >= 1 && r <= 14) porciones = r;
  }
  return {
    titulo,
    receta,
    videoQuery,
    ...(youtubeVideoId ? { youtubeVideoId } : {}),
    ...(kcal_estimate != null ? { kcal_estimate } : {}),
    ...(protein_g != null ? { protein_g } : {}),
    ...(fat_g != null ? { fat_g } : {}),
    ...(carb_g != null ? { carb_g } : {}),
    ...(fiber_g != null ? { fiber_g } : {}),
    ...(porciones != null ? { porciones } : {})
  };
}

function parseCronogramaJson(raw: unknown, diasEsperados: number, offsetDia: number): DiaPlan[] {
  if (!Array.isArray(raw)) throw new Error("La respuesta no es un array JSON.");
  const out: DiaPlan[] = [];
  for (let i = 0; i < diasEsperados; i++) {
    const row = raw[i];
    if (!row || typeof row !== "object") {
      throw new Error(`Falta el día ${offsetDia + i} en la respuesta.`);
    }
    const com = (row as { comidas?: unknown }).comidas;
    if (!com || typeof com !== "object") {
      throw new Error(`Día ${offsetDia + i}: falta objeto "comidas".`);
    }
    const c = com as Record<string, unknown>;
    out.push({
      dia: offsetDia + i,
      comidas: {
        desayuno: normalizeSlot(c.desayuno),
        almuerzo: normalizeSlot(c.almuerzo),
        cena: normalizeSlot(c.cena)
      }
    });
  }
  return out;
}

async function generarChunkModelo(
  modelId: string,
  perfil: PerfilUsuario,
  diasChunk: number,
  offsetDia: number,
  mercadoItems: ListaItem[] | undefined,
  modo: ModoCronograma
): Promise<DiaPlan[]> {
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: modelId,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 12288,
      temperature: 0.65
    }
  });

  const listaMercadoCompletaTxt = textoListaMercadoCompleta(mercadoItems);
  const compradosTxt = textoComprados(mercadoItems);
  const hayCompradosMarcados = Boolean(mercadoItems?.some((i) => i.comprado));
  const guiaMercado = instruccionMercadoPorModo(modo, hayCompradosMarcados);

  const prompt = `Eres un agente de recetas y dietética educativa (no clínico). Genera EXACTAMENTE ${diasChunk} días de comidas en español.
Cada día tiene desayuno, almuerzo y cena. Los números de día global van de ${offsetDia} a ${offsetDia + diasChunk - 1}.

Perfil (JSON): ${JSON.stringify(perfil)}
Modo de contexto declarado por el usuario: "${modo}".

=== LISTA DEL MERCADO (todas las filas tienen nombre + cantidades reales según usuario) ===
${listaMercadoCompletaTxt}

Ítems marcados como COMPRADOS (prioridad alta si existe):
${compradosTxt}

INSTRUCCIÓN de uso según modo:
${guiaMercado}

Reglas obligatorias:
- Respeta estiloDieta del perfil (keto muy bajo carbohidrato, mediterránea o balanceada) y evita cualquier ítem mencionado en alimentosEvitar; enfermedades solo como mención educativa corta sin diagnosticar.
- Cantidades por plato en el TEXTO deben estar alineadas con la despensa cuando uses ingredientes del mercado (consume cantidades coherentes durante la semana; no cites productos gigantes absurdos fuera del estilo keto/saludable).
- "porciones": entero 1–4 indicando CUÁNTAS RACIONES CUBRE la receta cuando preparas ese plato así descrito (1 = una persona/una vez; si sobra para día siguiente 2 está bien sólo si el texto dice “para 2 raciones”).
- Formato de "receta" en un solo texto, sin saltos de línea JSON:
  "Ingredientes (cantidades claras por porciones indicadas): … · Pasos: …"
  Pasos numerados breves (máx. ~560 caracteres el campo).
- Por defecto cada comida apunta a 1 persona; si porciones>1 dímelo en el texto.
- "titulo": corto y claro.
- "videoQuery": texto 6–16 palabras en español alineado con el mismo plato (ingrediente clave + técnica).
- Macros por comida cuando puedas estimar sin extremos falsos (1 porción): "kcal_estimate", "protein_g", "fat_g", "carb_g", "fiber_g" (grams; distribuye proporcionalmente si porciones>1 sólo como referencia TOTAL del plato entero aclarándolo implícito en valores).
- "youtube_video_id" (exactamente 11 caracteres válidos youtube o null): DEBES rellenarlo si conoces algún vídeo español/tutorial real que coincida claramente con el plato; es preferible embedding en la app antes que null.

Devuelve SOLO JSON: array de longitud ${diasChunk}. Cada elemento:
{
  "dia": <número global del día>,
  "comidas": {
    "desayuno": { "titulo": "", "receta": "", "videoQuery": "", "porciones": 1, "kcal_estimate": null, "protein_g": null, "fat_g": null, "carb_g": null, "fiber_g": null, "youtube_video_id": null },
    "almuerzo": { "titulo": "", "receta": "", "videoQuery": "", "porciones": 1, "kcal_estimate": null, "protein_g": null, "fat_g": null, "carb_g": null, "fiber_g": null, "youtube_video_id": null },
    "cena": { "titulo": "", "receta": "", "videoQuery": "", "porciones": 1, "kcal_estimate": null, "protein_g": null, "fat_g": null, "carb_g": null, "fiber_g": null, "youtube_video_id": null }
  }
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error("La IA no devolvió JSON válido. Prueba de nuevo o cambia de modelo.");
  }
  return parseCronogramaJson(parsed, diasChunk, offsetDia);
}

type SlotCron = "desayuno" | "almuerzo" | "cena";

function claveSlotYoutube(dayIdx: number, slot: SlotCron): string {
  return `${dayIdx}|${slot}`;
}

function clonarPlanes(plan: DiaPlan[]): DiaPlan[] {
  return JSON.parse(JSON.stringify(plan)) as DiaPlan[];
}

/** Sugiere vídeos de YouTube cuando el primer modelo no devolvió id (embed en-app). */
async function enriquecerYoutubeFaltantes(plan: DiaPlan[]): Promise<DiaPlan[]> {
  if (!key || typeof window === "undefined") return plan;

  type Pend = { dayPos: number; slot: SlotCron; titulo: string; q: string };
  const pend: Pend[] = [];
  plan.forEach((_, idx) => {
    const dayPos = idx + 1;
    const slots: SlotCron[] = ["desayuno", "almuerzo", "cena"];
    for (const slot of slots) {
      const p = plan[idx]?.comidas[slot];
      if (!p) continue;
      const yt = String(p.youtubeVideoId ?? "").trim();
      if (/^[a-zA-Z0-9_-]{11}$/.test(yt)) continue;
      const tituloPlato = String(p.titulo ?? "").trim();
      if (!tituloPlato) continue;
      pend.push({
        dayPos,
        slot,
        titulo: tituloPlato,
        q: String(p.videoQuery ?? tituloPlato).trim() || tituloPlato
      });
    }
  });

  if (pend.length === 0) return plan;

  const out = clonarPlanes(plan);
  const LOTE = 16;
  const genAI = new GoogleGenerativeAI(key);

  for (let i = 0; i < pend.length; i += LOTE) {
    const slice = pend.slice(i, i + LOTE);
    const payload = slice.map((p) => ({
      key: claveSlotYoutube(p.dayPos, p.slot),
      titulo: p.titulo,
      busqueda: p.q
    }));

    try {
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL_IDS[0]!,
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 4096,
          temperature: 0.25
        }
      });
      const r = await model.generateContent(`
Devuelve SÓLO un objeto JSON: cada CLAVE debe ser EXACTAMENTE el string "key" de cada entrada (ej. "1|desayuno").

Valor por clave:
- string de EXACTAMENTE 11 caracteres (YouTube youtube_video_id) de un vídeo español/tutorial de cocina que encaje con "titulo" y "busqueda", cuando conozcas un id REAL público, o
- null si no conoces ninguno (NO inventes cadenas).

Entradas:
${JSON.stringify(payload)}
`);
      const text = r.response.text();
      const mapa = JSON.parse(text) as Record<string, unknown>;
      for (const it of slice) {
        const k = claveSlotYoutube(it.dayPos, it.slot);
        const entrada = mapa[k];
        let idRaw = "";
        if (entrada === null || entrada === "null") continue;
        if (typeof entrada === "string") idRaw = entrada.trim();
        else if (entrada && typeof entrada === "object") {
          const v = (entrada as { youtube_video_id?: unknown }).youtube_video_id;
          if (typeof v === "string") idRaw = v.trim();
        }
        const id = idRaw.trim();
        if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) continue;
        const díaIdx = it.dayPos - 1;
        const díaObj = out[díaIdx];
        if (!díaObj?.comidas[it.slot]) continue;
        /* eslint-disable no-await-in-loop -- verificación secuencial limitada */
        const ok = await miniaturaYoutubeCarga(id);
        /* eslint-enable no-await-in-loop */
        if (ok) {
          díaObj.comidas[it.slot] = { ...díaObj.comidas[it.slot], youtubeVideoId: id };
        }
      }
    } catch {
      /* continuar sin vídeos extra */
    }
  }

  return out;
}

/** Genera todos los días solicitados (máx. 30), en trozos si hace falta, con Gemini. */
export async function generarCronogramaIA(
  perfil: PerfilUsuario,
  dias: number,
  mercadoItems: ListaItem[] | undefined,
  modo: ModoCronograma,
  onProgress?: (hecho: number, total: number, fase: "generando" | "enriqueciendo") => void
): Promise<DiaPlan[]> {
  if (!key) {
    throw new Error(
      `Activa el agente IA gratuito: obtén una clave en Google AI Studio (${URL_GOOGLE_AI_STUDIO_API_KEY}) y define VITE_GEMINI_API_KEY al construir la app (.env o GitHub Actions).`
    );
  }
  const total = Math.min(30, Math.max(3, Math.round(dias)));
  const partes: DiaPlan[] = [];
  let hecho = 0;

  onProgress?.(0, total, "generando");

  while (hecho < total) {
    const chunk = Math.min(CHUNK_DIAS, total - hecho);
    const offsetDia = hecho + 1;
    let chunkOk = false;
    for (let m = 0; m < GEMINI_MODEL_IDS.length; m++) {
      try {
        const slice = await generarChunkModelo(GEMINI_MODEL_IDS[m]!, perfil, chunk, offsetDia, mercadoItems, modo);
        partes.push(...slice);
        hecho += chunk;
        chunkOk = true;
        onProgress?.(hecho, total, "generando");
        break;
      } catch (e) {
        if (m === GEMINI_MODEL_IDS.length - 1) {
          throw e instanceof Error ? e : new Error(String(e));
        }
      }
    }
    if (!chunkOk) {
      throw new Error("No se pudo generar un tramo del cronograma con IA.");
    }
  }

  if (partes.length !== total) {
    throw new Error(`IA devolvió ${partes.length} días en lugar de ${total}.`);
  }

  onProgress?.(total, total, "enriqueciendo");
  const conVideos = await enriquecerYoutubeFaltantes(partes);
  return conVideos.map((p, i) => ({ ...p, dia: i + 1 }));
}
