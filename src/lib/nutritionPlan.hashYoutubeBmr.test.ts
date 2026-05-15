import { describe, expect, it } from "vitest";
import {
  calcularBmr,
  calcularTdeePerfil,
  hashString,
  youtubeBusqueda,
  youtubeBusquedaPlato,
  type PerfilUsuario
} from "./nutritionPlan";

describe("nutritionPlan hashString", () => {
  it("es estable para la misma entrada", () => {
    expect(hashString("")).toBe(0);
    expect(hashString("nutrisalud")).toBe(hashString("nutrisalud"));
    expect(hashString("a")).not.toBe(hashString("b"));
  });
});

describe("nutritionPlan YouTube helpers", () => {
  it("youtubeBusqueda codifica la consulta", () => {
    expect(youtubeBusqueda("huevos keto")).toContain("huevos%20keto");
    expect(youtubeBusqueda("a/b")).toContain(encodeURIComponent("a/b"));
  });

  it("youtubeBusquedaPlato incluye estilo y sufijo receta", () => {
    const u = youtubeBusquedaPlato("Pollo al horno", "limón", "keto");
    expect(u).toContain("Pollo");
    expect(u).toContain("keto");
    expect(u).toContain("receta");
    expect(u).toContain("espa%C3%B1ol");

    const med = youtubeBusquedaPlato("Ensalada", "atún", "mediterranea");
    expect(decodeURIComponent(med)).toMatch(/mediterr/i);

    const bal = youtubeBusquedaPlato("Wrap", "", "balanceada");
    expect(decodeURIComponent(bal)).toContain("saludable");
  });
});

describe("nutritionPlan BMR / TDEE", () => {
  const perfilBase = (): PerfilUsuario => ({
    nombre: "",
    edad: 30,
    pesoKg: 70,
    tallaCm: 165,
    sexo: "f",
    enfermedades: "",
    alimentosEvitar: "",
    estiloDieta: "balanceada"
  });

  it("calcularBmr femenino coincide con Mifflin-St Jeor", () => {
    const bmr = calcularBmr(perfilBase());
    expect(bmr).toBeCloseTo(1420.25, 2);
  });

  it("calcularBmr masculino suma offset distinto", () => {
    const bmr = calcularBmr({ ...perfilBase(), sexo: "m" });
    expect(bmr).toBeCloseTo(1586.25, 2);
  });

  it("calcularTdeePerfil aplica multiplicador por actividad", () => {
    const sed = calcularTdeePerfil(perfilBase());
    expect(sed).toBe(Math.round(calcularBmr(perfilBase()) * 1.35));

    const ligero = calcularTdeePerfil({ ...perfilBase(), nivelActividad: "ligero" });
    expect(ligero).toBe(Math.round(calcularBmr(perfilBase()) * 1.45));
  });
});
