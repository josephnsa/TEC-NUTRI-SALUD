import type { PerfilUsuario } from "./nutritionPlan";

const PERFIL_KEY = "tec_nutri_salud_perfil_v1";

export function loadPerfilLocal(): PerfilUsuario | null {
  try {
    const raw = localStorage.getItem(PERFIL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PerfilUsuario;
  } catch {
    return null;
  }
}

export function savePerfilLocal(p: PerfilUsuario) {
  localStorage.setItem(PERFIL_KEY, JSON.stringify(p));
}
