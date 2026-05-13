import { GoogleGenerativeAI } from "@google/generative-ai";
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
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const system = `Eres asistente de nutrición y estilo de vida en español. 
Reglas: no diagnosticar; recomendar consultar a médico/dietista ante enfermedad o medicación.
Perfil usuario (JSON): ${JSON.stringify(perfil)}
Responde de forma breve, práctica y segura.`;

  const result = await model.generateContent(`${system}\n\nPregunta del usuario:\n${pregunta}`);
  const text = result.response.text();
  return text.trim() || "Sin respuesta del modelo.";
}
