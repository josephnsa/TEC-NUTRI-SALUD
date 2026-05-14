import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ListaItem } from "./ketoMercado";
import type { DiaPlan, ModoCronograma, PerfilUsuario, PlatoReceta } from "./nutritionPlan";
import { GEMINI_MODEL_IDS } from "./geminiModels";
import { URL_GOOGLE_AI_STUDIO_API_KEY } from "./googleAiStudio";
import { youtubeVideoIdFromInput } from "./youtubeEmbed";

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

function compradosResumen(items: ListaItem[] | undefined): string {
  if (!items?.length) return "(sin lista de mercado o nada marcado como comprado)";
  const lines = items.filter((i) => i.comprado).map((i) => {
    const nm = (i.nombreCustom?.trim() || i.nombre).trim();
    return `${nm} (${i.cantidad} ${i.unidad})${i.origen === "manual" ? " [extra despensa]" : ""}`;
  });
  if (!lines.length) return "(lista de mercado sin ítems marcados como comprados)";
  return lines.join("; ");
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
    youtubeVideoIdFromInput(String(o.embedUrl ?? ""));
  const kcal_estimate = numOrUndef(o.kcal_estimate);
  const protein_g = numOrUndef(o.protein_g);
  const fat_g = numOrUndef(o.fat_g);
  const carb_g = numOrUndef(o.carb_g);
  return {
    titulo,
    receta,
    videoQuery,
    ...(youtubeVideoId ? { youtubeVideoId } : {}),
    ...(kcal_estimate != null ? { kcal_estimate } : {}),
    ...(protein_g != null ? { protein_g } : {}),
    ...(fat_g != null ? { fat_g } : {}),
    ...(carb_g != null ? { carb_g } : {})
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

  const mercadoTxt = compradosResumen(mercadoItems);
  const instruccionModo =
    modo === "perfil"
      ? "Prioriza variedad acorde al estilo de dieta y al perfil; el mercado es contexto opcional."
      : modo === "mercado"
        ? "Prioriza usar en las recetas los alimentos del mercado comprado; si faltan datos, sugiere sustitutos del mismo estilo."
        : "Combina perfil y mercado: usa lo comprado cuando encaje y respeta exclusiones.";

  const prompt = `Eres un agente de recetas y dietética educativa (no clínico). Genera EXACTAMENTE ${diasChunk} días de comidas en español.
Cada día tiene desayuno, almuerzo y cena. Los números de día global van de ${offsetDia} a ${offsetDia + diasChunk - 1}.

Perfil (JSON): ${JSON.stringify(perfil)}
Modo de contexto: ${modo}. ${instruccionModo}
Alimentos del mercado (comprados): ${mercadoTxt}

Reglas obligatorias:
- Porciones: TODAS las recetas son para EXACTAMENTE UNA (1) persona. Indica cantidades concretas (g, ml, cucharadas, unidades). El usuario escalará mentalmente si cocina para más gente.
- Formato de "receta" en un solo texto, sin saltos de línea JSON:
  "Ingredientes (1 porción): … · Pasos: …" — ingredientes con cantidades medibles; pasos numerados breves (máx. ~520 caracteres por campo receta).
- "titulo": nombre corto y claro del plato (visible en la app).
- "videoQuery": 6-14 palabras en español para buscar en YouTube el MISMO plato que describe titulo+receta (incluye ingrediente principal + técnica + estilo según estiloDieta). Sin URL completa salvo que necesites; prioriza texto de búsqueda. Coherente con el título.
- Respeta estiloDieta: keto (muy bajo carbohidrato), mediterranea o balanceada.
- Evita ingredientes en alimentosEvitar; enfermedades solo como precaución breve, sin diagnosticar.
- Opcionalmente por cada comida (cuando puedas estimar sin inventar valores extremos): "kcal_estimate" (aprox.), "protein_g", "fat_g", "carb_g" (gramos, 1 persona).
- Si conoces un video oficial coherente con el plato: "youtube_video_id" (exactamente 11 caracteres alfanuméricos de YouTube). Si no, null.

Devuelve SOLO un JSON: array de longitud ${diasChunk}. Cada elemento:
{
  "dia": <número global del día>,
  "comidas": {
    "desayuno": { "titulo": "", "receta": "", "videoQuery": "", "kcal_estimate": null, "protein_g": null, "fat_g": null, "carb_g": null, "youtube_video_id": null },
    "almuerzo": { "titulo": "", "receta": "", "videoQuery": "", "kcal_estimate": null, "protein_g": null, "fat_g": null, "carb_g": null, "youtube_video_id": null },
    "cena": { "titulo": "", "receta": "", "videoQuery": "", "kcal_estimate": null, "protein_g": null, "fat_g": null, "carb_g": null, "youtube_video_id": null }
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

/** Genera todos los días solicitados (máx. 30), en trozos si hace falta, con Gemini. */
export async function generarCronogramaIA(
  perfil: PerfilUsuario,
  dias: number,
  mercadoItems: ListaItem[] | undefined,
  modo: ModoCronograma
): Promise<DiaPlan[]> {
  if (!key) {
    throw new Error(
      `Activa el agente IA gratuito: obtén una clave en Google AI Studio (${URL_GOOGLE_AI_STUDIO_API_KEY}) y define VITE_GEMINI_API_KEY al construir la app (.env o GitHub Actions).`
    );
  }
  const total = Math.min(30, Math.max(3, Math.round(dias)));
  const partes: DiaPlan[] = [];
  let hecho = 0;

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

  return partes.map((p, i) => ({ ...p, dia: i + 1 }));
}
