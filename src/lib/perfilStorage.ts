import type { PerfilUsuario } from "./nutritionPlan";

const PERFIL_KEY = "tec_nutri_salud_perfil_v1";

/** Migra JSON antiguo (sin `nombre`) y sanea tipos. */
export function normalizePerfilParsed(raw: unknown): PerfilUsuario | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<PerfilUsuario>;
  const estilo = o.estiloDieta;
  const estiloOk =
    estilo === "mediterranea" || estilo === "balanceada" || estilo === "keto" ? estilo : "keto";
  const sex = o.sexo;
  const sexoOk = sex === "m" || sex === "f" ? sex : "o";
  const edad = Math.min(120, Math.max(12, Math.round(Number(o.edad) || 32)));
  const pesoKg = Math.min(250, Math.max(30, Number(o.pesoKg) || 70));
  const tallaCm = Math.min(220, Math.max(120, Number(o.tallaCm) || 165));
  const nombre =
    typeof o.nombre === "string" ? o.nombre.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  return {
    nombre,
    edad,
    pesoKg,
    tallaCm,
    sexo: sexoOk,
    enfermedades: typeof o.enfermedades === "string" ? o.enfermedades : "",
    alimentosEvitar: typeof o.alimentosEvitar === "string" ? o.alimentosEvitar : "",
    estiloDieta: estiloOk
  };
}

export function loadPerfilLocal(): PerfilUsuario | null {
  try {
    const raw = localStorage.getItem(PERFIL_KEY);
    if (!raw) return null;
    return normalizePerfilParsed(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function savePerfilLocal(p: PerfilUsuario) {
  const n = normalizePerfilParsed(p);
  localStorage.setItem(PERFIL_KEY, JSON.stringify(n ?? p));
}

export function perfilGuardadoEnDispositivo(): boolean {
  try {
    return Boolean(localStorage.getItem(PERFIL_KEY));
  } catch {
    return false;
  }
}
