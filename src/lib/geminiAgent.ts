import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL_IDS } from "./geminiModels";
import { URL_GOOGLE_AI_STUDIO_API_KEY } from "./googleAiStudio";
import type { PerfilUsuario } from "./nutritionPlan";

const key = import.meta.env.VITE_GEMINI_API_KEY ?? "";

export function geminiDisponible(): boolean {
  return Boolean(key);
}

export async function consultarAgenteNutricion(
  perfil: PerfilUsuario,
  pregunta: string
): Promise<string> {
  if (!key) {
    return (
      `Modo sin API: crea una clave gratuita en Google AI Studio (${URL_GOOGLE_AI_STUDIO_API_KEY}), configura VITE_GEMINI_API_KEY y vuelve a construir la app para respuestas generadas al instante. ` +
      "Mientras tanto, usa Mi plan para ver el cronograma y el mercado keto."
    );
  }

  const genAI = new GoogleGenerativeAI(key);
  const system = `Eres asistente de nutrición y estilo de vida en español. 
Reglas: no diagnosticar; recomendar consultar a médico/dietista ante enfermedad o medicación.
Perfil usuario (JSON): ${JSON.stringify(perfil)}
Responde de forma breve, práctica y segura.`;

  const prompt = `${system}\n\nPregunta del usuario:\n${pregunta}`;
  const fallos: string[] = [];
  for (let i = 0; i < GEMINI_MODEL_IDS.length; i++) {
    const modelId = GEMINI_MODEL_IDS[i]!;
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text.trim() || "Sin respuesta del modelo.";
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      fallos.push(`${modelId}: ${msg}`);
    }
  }
  throw new Error(
    `No respondió ningún modelo Gemini. Intentos:\n${fallos.join("\n")}\n\nEn Google Cloud: APIs & Services → habilita «Generative Language API». Revisa también restricciones de la clave (referrers / APIs permitidas).`
  );
}
