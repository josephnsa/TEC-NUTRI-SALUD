import { describe, expect, it } from "vitest";
import {
  calcularTdeePerfil,
  generarCronograma,
  presupuestoKcalOrientativoDiario,
  type PerfilUsuario
} from "./nutritionPlan";

function perfilBase(): PerfilUsuario {
  return {
    nombre: "",
    edad: 30,
    pesoKg: 70,
    tallaCm: 165,
    sexo: "f",
    enfermedades: "",
    alimentosEvitar: "",
    estiloDieta: "balanceada"
  };
}

describe("presupuestoKcalOrientativoDiario", () => {
  it("devuelve null sin peso objetivo", () => {
    expect(presupuestoKcalOrientativoDiario(perfilBase())).toBeNull();
    expect(
      presupuestoKcalOrientativoDiario({
        ...perfilBase(),
        objetivosNutricion: {}
      })
    ).toBeNull();
  });

  it("si el peso actual coincide con objetivo devuelve TDEE", () => {
    const p0 = perfilBase();
    expect(
      presupuestoKcalOrientativoDiario({
        ...p0,
        objetivosNutricion: { pesoObjetivoKg: 70 }
      })
    ).toBe(calcularTdeePerfil(p0));

    const pNear = { ...perfilBase(), pesoKg: 70.3, objetivosNutricion: { pesoObjetivoKg: 70 } };
    expect(presupuestoKcalOrientativoDiario(pNear)).toBe(calcularTdeePerfil(pNear));
  });

  it("déficit al bajar peso respeta ritmo y suelo 950", () => {
    const p = perfilBase();
    const tdee = calcularTdeePerfil(p);
    expect(
      presupuestoKcalOrientativoDiario({
        ...p,
        objetivosNutricion: { pesoObjetivoKg: 60, ritmo: "relajado" }
      })
    ).toBe(Math.max(950, Math.round(tdee - 350)));
    expect(
      presupuestoKcalOrientativoDiario({
        ...p,
        objetivosNutricion: { pesoObjetivoKg: 60, ritmo: "moderado" }
      })
    ).toBe(Math.max(950, Math.round(tdee - 500)));
  });

  it("superávit al subir peso según ritmo", () => {
    const p = perfilBase();
    const tdee = calcularTdeePerfil(p);
    expect(
      presupuestoKcalOrientativoDiario({
        ...p,
        objetivosNutricion: { pesoObjetivoKg: 75, ritmo: "relajado" }
      })
    ).toBe(Math.round(tdee + 200));
    expect(
      presupuestoKcalOrientativoDiario({
        ...p,
        objetivosNutricion: { pesoObjetivoKg: 75, ritmo: "moderado" }
      })
    ).toBe(Math.round(tdee + 350));
  });
});

describe("generarCronograma", () => {
  const p = perfilBase();

  it("acota días entre 3 y 30", () => {
    expect(generarCronograma(p, 1)).toHaveLength(3);
    expect(generarCronograma(p, 2)).toHaveLength(3);
    expect(generarCronograma(p, 100)).toHaveLength(30);
  });

  it("cada día incluye tres comidas con campos mínimos", () => {
    const plan = generarCronograma(p, 5, { modo: "perfil", claveVariedad: "unit-seed" });
    expect(plan).toHaveLength(5);
    for (const dia of plan) {
      expect(dia.dia).toBeGreaterThan(0);
      for (const slot of ["desayuno", "almuerzo", "cena"] as const) {
        const pl = dia.comidas[slot];
        expect(pl.titulo.length).toBeGreaterThan(0);
        expect(typeof pl.receta).toBe("string");
        expect(typeof pl.videoQuery).toBe("string");
      }
    }
  });

  it("es determinista con misma clave y modo", () => {
    const opts = { modo: "perfil" as const, claveVariedad: "determinismo-test" };
    const a = generarCronograma(p, 7, opts);
    const b = generarCronograma(p, 7, opts);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
