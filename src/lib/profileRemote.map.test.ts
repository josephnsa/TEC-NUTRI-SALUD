import { describe, expect, it } from "vitest";
import { perfilToRow, rowToPerfil } from "./profileRemote";
import type { PerfilUsuario } from "./nutritionPlan";

describe("profileRemote.rowToPerfil", () => {
  it("normaliza nombre y respeta estilos conocidos", () => {
    const p = rowToPerfil({
      id: "u1",
      display_name: "  Ana  ",
      age: 28,
      weight_kg: 65,
      height_cm: 160,
      sex: "f",
      conditions: "dm2",
      disliked_foods: "cacahuate",
      diet_style: "mediterranea"
    });
    expect(p.nombre).toBe("Ana");
    expect(p.estiloDieta).toBe("mediterranea");
    expect(p.sexo).toBe("f");
    expect(p.enfermedades).toBe("dm2");
  });

  it("cae en keto y valores por defecto si faltan o son raros", () => {
    const p = rowToPerfil({
      id: "u1",
      display_name: null,
      age: null,
      weight_kg: null,
      height_cm: null,
      sex: "otro",
      conditions: null,
      disliked_foods: null,
      diet_style: "unknown-style"
    });
    expect(p.estiloDieta).toBe("keto");
    expect(p.edad).toBe(30);
    expect(p.sexo).toBe("o");
  });
});

describe("profileRemote.perfilToRow", () => {
  const base = (): PerfilUsuario => ({
    nombre: "Pepe",
    edad: 40,
    pesoKg: 80,
    tallaCm: 175,
    sexo: "m",
    enfermedades: "",
    alimentosEvitar: "",
    estiloDieta: "balanceada"
  });

  it("mapea campos al row de Supabase", () => {
    const row = perfilToRow("uid-9", base());
    expect(row.id).toBe("uid-9");
    expect(row.display_name).toBe("Pepe");
    expect(row.age).toBe(40);
    expect(row.diet_style).toBe("balanceada");
    expect(row.sex).toBe("m");
  });

  it("display_name null si nombre vacío", () => {
    const row = perfilToRow("id", { ...base(), nombre: "   " });
    expect(row.display_name).toBeNull();
  });
});
