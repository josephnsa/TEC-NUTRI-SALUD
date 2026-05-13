import { supabase } from "./supabase";
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

export async function upsertProfileRemote(userId: string, p: PerfilUsuario): Promise<boolean> {
  if (!supabase) return false;
  const row = perfilToRow(userId, p);
  const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
  return !error;
}
