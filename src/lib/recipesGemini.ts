import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ListaItem } from "./ketoMercado";
import type { DiaPlan, ModoCronograma, PerfilUsuario } from "./nutritionPlan";
import { GEMINI_MODEL_IDS } from "./geminiModels";
import { URL_GOOGLE_AI_STUDIO_API_KEY } from "./googleAiStudio";

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
  const nombres = items.filter((i) => i.comprado).map((i) => `${i.nombre} (${i.cantidad} ${i.unidad})`);
  if (!nombres.length) return "(lista de mercado sin ítems marcados como comprados)";
  return nombres.join("; ");
}

function normalizeSlot(x: unknown): { titulo: string; receta: string; videoQuery: string } {
  if (!x || typeof x !== "object") {
    return {
      titulo: "Comida sugerida",
      receta: "Ajusta ingredientes a tu plan y preferencias.",
      videoQuery: "receta saludable casera español"
    };
  }
  const o = x as Record<string, unknown>;
  const titulo = String(o.titulo ?? "Plato").trim() || "Plato";
  const receta = String(o.receta ?? "").trim() || "Preparación al gusto con ingredientes disponibles.";
  const videoQuery = String(o.videoQuery ?? o.titulo ?? "receta").trim() || titulo;
  return { titulo, receta, videoQuery };
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
      maxOutputTokens: 8192,
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

Reglas:
- Respeta estiloDieta: keto (muy bajo carbohidrato), mediterranea o balanceada.
- Evita o minimiza ingredientes listados en alimentosEvitar.
- Ten en cuenta enfermedades solo como precaución textual breve en recetas (no diagnosticar).
- receta: máximo 220 caracteres, pasos cortos.
- videoQuery: 4-8 palabras clave en español para buscar en YouTube (sin URL).

Devuelve SOLO un JSON: array de longitud ${diasChunk}. Cada elemento:
{
  "dia": <número global del día>,
  "comidas": {
    "desayuno": { "titulo": "", "receta": "", "videoQuery": "" },
    "almuerzo": { "titulo": "", "receta": "", "videoQuery": "" },
    "cena": { "titulo": "", "receta": "", "videoQuery": "" }
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
