import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL_IDS } from "./geminiModels";
import { URL_GOOGLE_AI_STUDIO_API_KEY } from "./googleAiStudio";
import type { PerfilUsuario } from "./nutritionPlan";
import type { ListaItem } from "./ketoMercado";

const key = import.meta.env.VITE_GEMINI_API_KEY ?? "";

export function geminiMercadoDisponible(): boolean {
  return Boolean(key);
}

export { URL_GOOGLE_AI_STUDIO_API_KEY };

type RawItem = {
  nombre?: unknown;
  unidad?: unknown;
  cantidad?: unknown;
  categoria?: unknown;
  nota?: unknown;
};

const CATEGORIAS_VALIDAS = ["proteina", "grasa", "verdura", "lacteo", "extras"] as const;
type CategoriaIA = (typeof CATEGORIAS_VALIDAS)[number];

function normalizarCategoria(v: unknown): CategoriaIA {
  if (typeof v === "string" && CATEGORIAS_VALIDAS.includes(v as CategoriaIA)) {
    return v as CategoriaIA;
  }
  const s = String(v ?? "").toLowerCase().trim();
  if (s.includes("prot") || s.includes("carne") || s.includes("pollo") || s.includes("huevo")) return "proteina";
  if (s.includes("gras") || s.includes("aceite") || s.includes("nuez") || s.includes("aguac")) return "grasa";
  if (s.includes("verd") || s.includes("frut") || s.includes("vegetal")) return "verdura";
  if (s.includes("lact") || s.includes("queso") || s.includes("yogur") || s.includes("leche")) return "lacteo";
  return "extras";
}

function normalizarUnidad(v: unknown): string {
  const s = String(v ?? "g").toLowerCase().trim();
  if (["g", "kg", "ml", "l", "unidades"].includes(s)) return s;
  if (s.includes("gram") || s === "gramos") return "g";
  if (s.includes("kg") || s === "kilogramos") return "kg";
  if (s.includes("ml") || s.includes("milil")) return "ml";
  if (s.includes("ltr") || s === "litro" || s === "litros") return "l";
  return "unidades";
}

function normalizarItem(raw: RawItem, dias: number, personas: number): ListaItem | null {
  const nombre = String(raw.nombre ?? "").trim();
  if (!nombre) return null;
  const cantidad = Math.max(1, Math.round(Number(raw.cantidad) || 1));
  const unidad = normalizarUnidad(raw.unidad);
  const categoria = normalizarCategoria(raw.categoria);
  const nota = typeof raw.nota === "string" ? raw.nota.trim() : undefined;
  const id = `ia-${nombre.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}-${Math.random().toString(36).slice(2, 6)}`;
  const basePorPersonaDia = Math.max(0.1, cantidad / Math.max(1, dias) / Math.max(1, personas));
  return {
    id,
    nombre,
    unidad,
    basePorPersonaDia,
    categoria,
    ...(nota ? { nota } : {}),
    cantidad,
    comprado: false,
    origen: "ia"
  };
}

function buildPromptMercado(perfil: PerfilUsuario, dias: number, personas: number): string {
  const estiloLabel: Record<string, string> = {
    keto: "cetogénica (muy bajo en carbohidratos: < 50 g/día, alta en grasas saludables y proteína moderada)",
    mediterranea: "mediterránea (aceite de oliva, pescado, legumbres, cereales integrales, poca carne roja)",
    balanceada: "balanceada y variada (todos los grupos, macros equilibrados)"
  };
  const estilo = estiloLabel[perfil.estiloDieta] ?? perfil.estiloDieta;

  const restricciones: string[] = [];
  if (perfil.alimentosEvitar?.trim()) restricciones.push(`Alimentos a EVITAR por preferencia: ${perfil.alimentosEvitar}`);
  if (perfil.enfermedades?.trim()) restricciones.push(`Condiciones de salud a tener en cuenta: ${perfil.enfermedades}`);

  return `Eres un dietista-nutricionista experto en dieta ${estilo}.

Tu tarea: genera una lista de compra de supermercado personalizada para ${personas} persona(s) durante ${dias} días siguiendo dieta ${perfil.estiloDieta}.

Datos del usuario:
- Sexo: ${perfil.sexo === "f" ? "Femenino" : perfil.sexo === "m" ? "Masculino" : "No especificado"}
- Edad: ${perfil.edad} años, Peso actual: ${perfil.pesoKg} kg, Talla: ${perfil.tallaCm} cm
${restricciones.length > 0 ? restricciones.map((r) => `- ${r}`).join("\n") : "- Sin restricciones adicionales"}

Instrucciones:
1. Genera entre 20 y 35 ítems de la compra reales y específicos (nada genérico como "carne").
2. Las cantidades deben ser realistas para ${personas} persona(s) × ${dias} días respetando el estilo de dieta.
3. Cubre todas las categorías: proteína, grasa, verdura, lácteo, extras (condimentos, bebidas).
4. Los nombres deben ser concretos: "Pechuga de pollo", "Aceite de oliva virgen extra", "Espinacas frescas", etc.
5. Unidades solo de: "g", "kg", "ml", "l", "unidades".
6. Categoría solo de: "proteina", "grasa", "verdura", "lacteo", "extras".

Devuelve SOLO JSON válido, array sin comentarios:
[
  { "nombre": "string", "unidad": "g|kg|ml|l|unidades", "cantidad": number, "categoria": "proteina|grasa|verdura|lacteo|extras", "nota": "string (opcional)" }
]`;
}

async function llamarModeloMercado(
  modelId: string,
  perfil: PerfilUsuario,
  dias: number,
  personas: number
): Promise<ListaItem[]> {
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: modelId,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 4096,
      temperature: 0.5
    }
  });

  const prompt = buildPromptMercado(perfil, dias, personas);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error("La IA no devolvió JSON válido para el mercado. Intenta de nuevo.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("La respuesta IA no es un array. Intenta de nuevo.");
  }

  const items: ListaItem[] = [];
  for (const raw of parsed as RawItem[]) {
    const item = normalizarItem(raw, dias, personas);
    if (item) items.push(item);
  }

  if (items.length < 5) {
    throw new Error(`La IA generó muy pocos ítems (${items.length}). Intenta de nuevo.`);
  }

  return items;
}

export async function generarMercadoIA(
  perfil: PerfilUsuario,
  dias: number,
  personas: number,
  onProgress?: (fase: "generando" | "listo") => void
): Promise<ListaItem[]> {
  if (!key) {
    throw new Error(
      `Activa el agente IA gratuito: obtén una clave en Google AI Studio (${URL_GOOGLE_AI_STUDIO_API_KEY}) y define VITE_GEMINI_API_KEY al construir la app.`
    );
  }

  onProgress?.("generando");

  for (let m = 0; m < GEMINI_MODEL_IDS.length; m++) {
    try {
      const items = await llamarModeloMercado(GEMINI_MODEL_IDS[m]!, perfil, dias, personas);
      onProgress?.("listo");
      return items;
    } catch (e) {
      if (m === GEMINI_MODEL_IDS.length - 1) {
        throw e instanceof Error ? e : new Error(String(e));
      }
    }
  }

  throw new Error("No se pudo generar la lista con IA.");
}
