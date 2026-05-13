import {
  PLANTILLAS_BAL_RAW,
  PLANTILLAS_KETO_RAW,
  PLANTILLAS_MED_RAW
} from "../data/mealTemplates";
import type { ListaItem } from "./ketoMercado";

export type PerfilUsuario = {
  /** Nombre o apodo (visible en resumen y opcional en IA). */
  nombre: string;
  edad: number;
  pesoKg: number;
  tallaCm: number;
  sexo: "f" | "m" | "o";
  enfermedades: string;
  alimentosEvitar: string;
  estiloDieta: "keto" | "mediterranea" | "balanceada";
};

export type ComidaDia = {
  desayuno: { titulo: string; receta: string; videoQuery: string };
  almuerzo: { titulo: string; receta: string; videoQuery: string };
  cena: { titulo: string; receta: string; videoQuery: string };
};

export type DiaPlan = { dia: number; comidas: ComidaDia };

export type ModoCronograma = "perfil" | "mercado" | "mixto";

export type OpcionesCronograma = {
  modo?: ModoCronograma;
  /** Ítems del mercado (solo `comprado: true` influyen en modo mercado/mixto). */
  mercadoItems?: ListaItem[];
  /** Cambia la rotación de sugerencias sin tocar el perfil. */
  claveVariedad?: string;
};

const MERCADO_ID_KEYWORDS: Record<string, string[]> = {
  huevo: ["huevo", "huevos", "tortilla", "omelette", "omelet", "frittata", "revuelto", "poché", "chaffle"],
  pollo: ["pollo", "pechuga", "muslo", "pavo"],
  pescado: ["pescado", "salm", "salmon", "merluza", "tilapia", "atún", "atun", "bacalao", "filete blanco"],
  carne: ["res", "carne", "molida", "ternera", "bistec", "hamburguesa", "lomo"],
  tocino: ["tocino", "bacon"],
  queso: ["queso", "mozzarella", "parmesano", "cheddar", "ricotta", "requesón", "feta", "crema"],
  mantequilla: ["mantequilla", "ghee"],
  aceite: ["aceite", "oliva", "aderezo"],
  aguacate: ["aguacate"],
  nueces: ["nuez", "nueces", "almendra", "almendras", "semillas", "chia", "chía"],
  verdura_hoja: ["lechuga", "espinaca", "ensalada", "romana", "mixta"],
  verdura_baja: ["brócoli", "brocoli", "coliflor", "calabac", "calabacín", "menestra", "verduras"],
  champinon: ["champiñ", "champin"],
  crema: ["crema", "gratin"],
  mayo: ["mayonesa"],
  cafe: ["café", "cafe", "caffe"]
};

function cloneDia(d: ComidaDia): ComidaDia {
  return {
    desayuno: { ...d.desayuno },
    almuerzo: { ...d.almuerzo },
    cena: { ...d.cena }
  };
}

function plantillasBrutas(estilo: PerfilUsuario["estiloDieta"]): ComidaDia[] {
  const raw =
    estilo === "keto" ? PLANTILLAS_KETO_RAW : estilo === "mediterranea" ? PLANTILLAS_MED_RAW : PLANTILLAS_BAL_RAW;
  return raw.map((d) => ({
    desayuno: { ...d.desayuno },
    almuerzo: { ...d.almuerzo },
    cena: { ...d.cena }
  }));
}

function normText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function scoreComida(
  comida: { titulo: string; receta: string },
  compradosIds: Set<string>
): number {
  if (compradosIds.size === 0) return 0;
  const t = normText(`${comida.titulo} ${comida.receta}`);
  let s = 0;
  for (const id of compradosIds) {
    const kws = MERCADO_ID_KEYWORDS[id];
    if (!kws) continue;
    for (const kw of kws) {
      if (t.includes(normText(kw))) {
        s += 2;
        break;
      }
    }
  }
  return s;
}

function scoreDia(tpl: ComidaDia, compradosIds: Set<string>): number {
  return (
    scoreComida(tpl.desayuno, compradosIds) +
    scoreComida(tpl.almuerzo, compradosIds) +
    scoreComida(tpl.cena, compradosIds)
  );
}

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function shuffleDeterministic<T>(arr: T[], seed: string): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = hashString(`${seed}|shuffle|${i}`) % (i + 1);
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

function keyDia(tpl: ComidaDia): string {
  return `${tpl.desayuno.titulo}|${tpl.almuerzo.titulo}|${tpl.cena.titulo}`;
}

function parseEvitar(p: PerfilUsuario): string[] {
  return p.alimentosEvitar
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function comidaContieneEvitados(comida: { titulo: string; receta: string }, evitar: string[]): boolean {
  const t = normText(`${comida.titulo} ${comida.receta}`);
  return evitar.some((e) => e.length > 1 && t.includes(normText(e)));
}

function sustituirComida(
  tipo: "desayuno" | "almuerzo" | "cena",
  estilo: PerfilUsuario["estiloDieta"],
  evitar: string[]
): ComidaDia[typeof tipo] {
  const pool = plantillasBrutas(estilo).flatMap((d) => d[tipo]);
  const ok = pool.find((c) => !comidaContieneEvitados(c, evitar));
  return ok ? { ...ok } : { ...pool[0]! };
}

function aplicarEvitarDia(tpl: ComidaDia, p: PerfilUsuario): ComidaDia {
  const evitar = parseEvitar(p);
  const comidas = cloneDia(tpl);
  (["desayuno", "almuerzo", "cena"] as const).forEach((slot) => {
    if (comidaContieneEvitados(comidas[slot], evitar)) {
      comidas[slot] = sustituirComida(slot, p.estiloDieta, evitar);
    }
  });
  return comidas;
}

function construirPoolBase(p: PerfilUsuario): ComidaDia[] {
  return plantillasBrutas(p.estiloDieta).map((tpl) => aplicarEvitarDia(cloneDia(tpl), p));
}

function construirPoolCronograma(p: PerfilUsuario, opts?: OpcionesCronograma): ComidaDia[] {
  const base = construirPoolBase(p);
  const modo = opts?.modo ?? "mixto";
  const seed = opts?.claveVariedad ?? "defecto";
  const items = opts?.mercadoItems ?? [];
  const compradosIds = new Set(items.filter((i) => i.comprado).map((i) => i.id));

  if (modo === "perfil") {
    return shuffleDeterministic(base, `${seed}|perfil`);
  }

  const scored = base.map((tpl) => ({
    tpl,
    score: scoreDia(tpl, compradosIds)
  }));

  if (modo === "mercado") {
    if (compradosIds.size === 0) {
      return shuffleDeterministic(base, `${seed}|mercado-sin-comprados`);
    }
    const conMatch = scored.filter((x) => x.score > 0);
    const fuente = conMatch.length ? conMatch : scored;
    return fuente
      .sort((a, b) => b.score - a.score || hashString(seed + a.tpl.desayuno.titulo) - hashString(seed + b.tpl.desayuno.titulo))
      .map((x) => cloneDia(x.tpl));
  }

  const sorted = [...scored].sort(
    (a, b) =>
      b.score - a.score ||
      hashString(`${seed}|${a.tpl.desayuno.titulo}`) - hashString(`${seed}|${b.tpl.desayuno.titulo}`)
  );
  const altas = sorted.filter((x) => x.score > 0).map((x) => cloneDia(x.tpl));
  const bajas = sorted.filter((x) => x.score === 0).map((x) => cloneDia(x.tpl));
  const bajasMezcladas = shuffleDeterministic(bajas, `${seed}|mixto-baja`);
  return [...altas, ...bajasMezcladas];
}

function elegirPlantillaParaDia(
  pool: ComidaDia[],
  numeroDia: number,
  clave: string,
  recientes: string[]
): ComidaDia {
  const n = pool.length;
  const start = hashString(`${clave}|dia|${numeroDia}`) % n;
  const ultimos = recientes.slice(-2);
  for (let k = 0; k < n; k++) {
    const idx = (start + k * 7) % n;
    const candidato = cloneDia(pool[idx]!);
    const key = keyDia(candidato);
    if (!ultimos.includes(key)) {
      recientes.push(key);
      if (recientes.length > 8) recientes.shift();
      return candidato;
    }
  }
  const fallback = cloneDia(pool[start % n]!);
  recientes.push(keyDia(fallback));
  if (recientes.length > 8) recientes.shift();
  return fallback;
}

export function youtubeBusqueda(query: string): string {
  const q = encodeURIComponent(query);
  return `https://www.youtube.com/results?search_query=${q}`;
}

/** Une el nombre del plato + palabras clave + estilo para que los videos suelan coincidir con la receta mostrada. */
export function youtubeBusquedaPlato(
  titulo: string,
  videoQuery: string,
  estiloDieta?: PerfilUsuario["estiloDieta"]
): string {
  const estiloTxt =
    estiloDieta === "keto" ? "keto" : estiloDieta === "mediterranea" ? "mediterránea" : "saludable";
  const core = `${titulo.trim()} ${(videoQuery || "").trim()}`.replace(/\s+/g, " ").trim();
  return youtubeBusqueda(`${core} receta ${estiloTxt} español`);
}

/** Mifflin-St Jeor */
export function calcularBmr(p: PerfilUsuario): number {
  const { pesoKg, tallaCm, edad, sexo } = p;
  const base = 10 * pesoKg + 6.25 * tallaCm - 5 * edad;
  if (sexo === "m") return base + 5;
  if (sexo === "f") return base - 161;
  return base - 78;
}

export function calcularTdeeSedentario(bmr: number): number {
  return Math.round(bmr * 1.35);
}

export function resumenNutricional(p: PerfilUsuario): string[] {
  const bmr = calcularBmr(p);
  const tdee = calcularTdeeSedentario(bmr);
  const lineas: string[] = [];
  if (p.nombre.trim()) {
    lineas.push(`Perfil: ${p.nombre.trim()}.`);
  }
  lineas.push(
    `Estimación energética (orientativa, no diagnóstico): gasto aproximado sedentario ~${tdee} kcal/día.`,
    `Tu IMC aproximado: ${(p.pesoKg / Math.pow(p.tallaCm / 100, 2)).toFixed(1)}.`
  );
  const enf = p.enfermedades.toLowerCase();
  if (enf.includes("diabetes") || enf.includes("dm")) {
    lineas.push(
      "Si tienes diabetes, prioriza el seguimiento médico; las recomendaciones aquí son educativas y no sustituyen tratamiento."
    );
  }
  if (enf.includes("hipertens") || enf.includes("presión")) {
    lineas.push("Para hipertensión: moderar sodio y consultar por límites de proteína/grasas según tu médico.");
  }
  if (enf.includes("riñ") || enf.includes("renal")) {
    lineas.push("Enfermedad renal: evita cambios de dieta sin nefrólogo; muchas dietas altas en proteína no son adecuadas.");
  }
  if (p.estiloDieta === "keto") {
    lineas.push(
      "Ceto: útil para algunos objetivos, no es para todos. No recomendado en embarazo/lactancia sin supervisión."
    );
  }
  return lineas;
}

export function generarCronograma(
  p: PerfilUsuario,
  dias: number,
  opts?: OpcionesCronograma
): DiaPlan[] {
  const d = Math.min(30, Math.max(3, Math.round(dias)));
  const pool = construirPoolCronograma(p, opts);
  const clave = opts?.claveVariedad ?? "defecto";
  const recientes: string[] = [];
  const out: DiaPlan[] = [];
  for (let i = 0; i < d; i++) {
    const comidas = elegirPlantillaParaDia(pool, i + 1, clave, recientes);
    out.push({ dia: i + 1, comidas });
  }
  return out;
}

export function contarCompradosMercado(items: ListaItem[] | undefined): number {
  if (!items?.length) return 0;
  return items.filter((i) => i.comprado).length;
}
