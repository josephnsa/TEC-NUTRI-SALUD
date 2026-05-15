import { supabase } from "./supabase";
import type { EstadoPerfiles } from "./perfilStorage";
import { aplicarEstadoPerfilesRemoto, parseEstadoPerfilesFromUnknown } from "./perfilStorage";
import { restaurarActivosLocalesDesdeEstado } from "./prefsActivos";
import type { PerfilUsuario } from "./nutritionPlan";

type ProfileRow = {
  id: string;
  display_name: string | null;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  sex: string | null;
  conditions: string | null;
  disliked_foods: string | null;
  diet_style: string | null;
  family_json?: unknown;
};

export function rowToPerfil(row: ProfileRow): PerfilUsuario {
  return {
    nombre: (row.display_name ?? "").trim().slice(0, 80),
    edad: row.age ?? 30,
    pesoKg: Number(row.weight_kg ?? 70),
    tallaCm: Number(row.height_cm ?? 165),
    sexo: row.sex === "m" || row.sex === "f" ? row.sex : "o",
    enfermedades: row.conditions ?? "",
    alimentosEvitar: row.disliked_foods ?? "",
    estiloDieta:
      row.diet_style === "mediterranea" || row.diet_style === "balanceada"
        ? row.diet_style
        : "keto"
  };
}

export function perfilToRow(userId: string, p: PerfilUsuario): Partial<ProfileRow> & { id: string } {
  return {
    id: userId,
    display_name: p.nombre.trim() ? p.nombre.trim().slice(0, 80) : null,
    age: p.edad,
    weight_kg: p.pesoKg,
    height_cm: p.tallaCm,
    sex: p.sexo,
    conditions: p.enfermedades,
    disliked_foods: p.alimentosEvitar,
    diet_style: p.estiloDieta
  };
}

export async function fetchProfileRemote(userId: string): Promise<PerfilUsuario | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error || !data) return null;
  return rowToPerfil(data as ProfileRow);
}

/** Lee `family_json` sin mutar el dispositivo. */
export async function fetchFamilyRemote(userId: string): Promise<EstadoPerfiles | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("family_json").eq("id", userId).maybeSingle();
  if (error || !data) return null;
  const raw = (data as { family_json?: unknown }).family_json;
  if (raw == null) return null;
  return parseEstadoPerfilesFromUnknown(raw);
}

/** Aplica perfiles remotos al almacenamiento local si son válidos. */
export async function fetchAndApplyFamilyRemote(userId: string): Promise<boolean> {
  const fam = await fetchFamilyRemote(userId);
  if (!fam) return false;
  const ok = aplicarEstadoPerfilesRemoto(fam);
  if (ok) restaurarActivosLocalesDesdeEstado(fam);
  return ok;
}

export type UpsertProfileOpts = { family?: EstadoPerfiles };

export async function upsertProfileRemote(
  userId: string,
  p: PerfilUsuario,
  opts?: UpsertProfileOpts
): Promise<boolean> {
  if (!supabase) return false;
  const row: Partial<ProfileRow> & { id: string; updated_at: string } = {
    ...perfilToRow(userId, p),
    updated_at: new Date().toISOString()
  };
  if (opts?.family) row.family_json = opts.family;
  const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
  return !error;
}
