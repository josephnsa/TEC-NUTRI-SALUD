import { describe, expect, it } from "vitest";
import { normalizePerfilParsed } from "./perfilStorage";

describe("normalizePerfilParsed", () => {
  it("rechaza entrada no objeto", () => {
    expect(normalizePerfilParsed(null)).toBeNull();
    expect(normalizePerfilParsed("x")).toBeNull();
  });

  it("sanea edad, peso, estilo y nombre", () => {
    const p = normalizePerfilParsed({
      nombre: "  María   López  ",
      edad: 5,
      pesoKg: 500,
      tallaCm: 50,
      sexo: "f",
      estiloDieta: "mediterranea",
      enfermedades: "",
      alimentosEvitar: ""
    });
    expect(p).not.toBeNull();
    expect(p!.nombre).toBe("María López");
    expect(p!.edad).toBe(12);
    expect(p!.pesoKg).toBe(250);
    expect(p!.tallaCm).toBe(120);
    expect(p!.estiloDieta).toBe("mediterranea");
  });

  it("estilo desconocido pasa a keto", () => {
    const p = normalizePerfilParsed({
      edad: 30,
      pesoKg: 70,
      tallaCm: 165,
      sexo: "o",
      estiloDieta: "vegana",
      enfermedades: "",
      alimentosEvitar: ""
    });
    expect(p!.estiloDieta).toBe("keto");
  });

  it("objetivos nutricion con peso y ritmo validos", () => {
    const p = normalizePerfilParsed({
      edad: 30,
      pesoKg: 70,
      tallaCm: 165,
      sexo: "f",
      estiloDieta: "keto",
      enfermedades: "",
      alimentosEvitar: "",
      objetivosNutricion: { pesoObjetivoKg: 65.4, ritmo: "moderado" }
    });
    expect(p!.objetivosNutricion?.pesoObjetivoKg).toBe(65.4);
    expect(p!.objetivosNutricion?.ritmo).toBe("moderado");
  });
});
