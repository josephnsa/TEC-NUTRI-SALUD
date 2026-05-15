import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL_IDS } from "./geminiModels";
import { URL_GOOGLE_AI_STUDIO_API_KEY } from "./googleAiStudio";
import type { PerfilUsuario } from "./nutritionPlan";
import { calcularTdeePerfil, presupuestoKcalOrientativoDiario, sumarMacrosComidaDia } from "./nutritionPlan";
import type { ListaItem } from "./ketoMercado";
import type { CronogramaSnapshot } from "./cronogramaHistorial";

const key = import.meta.env.VITE_GEMINI_API_KEY ?? "";

export function geminiDisponible(): boolean {
  return Boolean(key);
}

export type ContextoAgente = {
  mercadoItems?: ListaItem[];
  snapActivo?: CronogramaSnapshot | null;
};

function construirContextoExtra(ctx: ContextoAgente): string {
  const partes: string[] = [];

  if (ctx.mercadoItems?.length) {
    const comprados = ctx.mercadoItems.filter((i) => i.comprado);
    const resumenItems = ctx.mercadoItems
      .slice(0, 30)
      .map((i) => `${i.nombre} ${i.cantidad}${i.unidad}${i.comprado ? " ✓" : ""}`)
      .join(", ");
    partes.push(
      `\n=== MERCADO ACTIVO DEL USUARIO ===\n` +
      `Total ítems: ${ctx.mercadoItems.length} (${comprados.length} marcados comprados)\n` +
      `Ítems: ${resumenItems}${ctx.mercadoItems.length > 30 ? " …(más)" : ""}`
    );
  }

  if (ctx.snapActivo?.diasPlan?.length) {
    const snap = ctx.snapActivo;
    const diasConKcal = snap.diasPlan.filter((d) => {
      const tot = sumarMacrosComidaDia(d.comidas);
      return tot.kcal > 0;
    });
    const promedioKcal =
      diasConKcal.length > 0
        ? Math.round(diasConKcal.reduce((s, d) => s + sumarMacrosComidaDia(d.comidas).kcal, 0) / diasConKcal.length)
        : null;

    const ejemploDias = snap.diasPlan
      .slice(0, 3)
      .map(
        (d) =>
          `D${d.dia}: ${d.comidas.desayuno.titulo} / ${d.comidas.almuerzo.titulo} / ${d.comidas.cena.titulo}`
      )
      .join("\n");

    partes.push(
      `\n=== PLAN DE MENÚ ACTIVO ===\n` +
      `Fuente: ${snap.fuente === "ia" ? "Agente IA" : "Plantillas"} · ${snap.dias} días · modo ${snap.modo}\n` +
      (promedioKcal ? `Promedio kcal/día del plan: ~${promedioKcal} kcal\n` : "") +
      `Muestra de días:\n${ejemploDias}`
    );
  }

  return partes.join("\n");
}

export async function consultarAgenteNutricion(
  perfil: PerfilUsuario,
  pregunta: string,
  contexto?: ContextoAgente
): Promise<string> {
  if (!key) {
    return (
      `Modo sin API: crea una clave gratuita en Google AI Studio (${URL_GOOGLE_AI_STUDIO_API_KEY}), configura VITE_GEMINI_API_KEY y vuelve a construir la app para respuestas generadas al instante. ` +
      "Mientras tanto, usa Mi plan para ver el cronograma y el mercado keto."
    );
  }

  const tdee = calcularTdeePerfil(perfil);
  const kcalObjetivo = presupuestoKcalOrientativoDiario(perfil) ?? tdee;
  const contextoExtra = contexto ? construirContextoExtra(contexto) : "";

  const genAI = new GoogleGenerativeAI(key);
  const system = `Eres dietista-nutricionista especializado en dieta ${perfil.estiloDieta} y asistente de estilo de vida saludable. Hablas en español con precisión técnica pero lenguaje accesible.
Reglas: no diagnosticar; recomendar consultar a médico/dietista ante enfermedad o medicación.
Si sugieres recetas o listas de comidas, indica cantidades orientativas para UNA (1) persona salvo que el usuario pida otra cosa.

Perfil del usuario:
${JSON.stringify(perfil)}
TDEE estimado: ~${tdee} kcal/día · Objetivo calórico: ~${kcalObjetivo} kcal/día
${contextoExtra}

Responde de forma concreta, práctica y segura. Usa listas o secciones cuando ayude a la claridad.`;

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
