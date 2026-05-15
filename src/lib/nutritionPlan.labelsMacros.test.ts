import { describe, expect, it } from "vitest";
import {
  CATEGORIA_LABELS,
  DIETA_LABELS,
  labelDieta,
  sumarMacrosComidaDia,
  sumarMacrosPlatoSlot,
  type ComidaDia,
  type PlatoReceta
} from "./nutritionPlan";

function plato(base: Partial<PlatoReceta> = {}): PlatoReceta {
  return {
    titulo: "Plato",
    receta: "Receta",
    videoQuery: "query",
    ...base
  };
}

describe("nutritionPlan labels", () => {
  it("labelDieta cubre mapa y valores desconocidos", () => {
    expect(labelDieta()).toBe("No definida");
    expect(labelDieta("keto")).toBe(DIETA_LABELS.keto);
    expect(labelDieta("mediterranea")).toBe(DIETA_LABELS.mediterranea);
    expect(labelDieta("vegana")).toBe("Vegana");
  });

  it("CATEGORIA_LABELS tiene claves esperadas del mercado", () => {
    expect(CATEGORIA_LABELS.proteina).toBeTruthy();
    expect(CATEGORIA_LABELS.cereal).toBeTruthy();
  });
});

describe("nutritionPlan macros", () => {
  it("sumarMacrosPlatoSlot ignora NaN y negativos", () => {
    expect(
      sumarMacrosPlatoSlot(
        plato({
          kcal_estimate: 100,
          protein_g: 10,
          fat_g: 5,
          carb_g: 2,
          fiber_g: 1
        })
      )
    ).toEqual({ kcal: 100, proteinG: 10, fatG: 5, carbG: 2, fiberG: 1 });

    expect(sumarMacrosPlatoSlot(plato({ kcal_estimate: NaN }))).toMatchObject({
      kcal: 0
    });
  });

  it("sumarMacrosComidaDia acumula tres slots", () => {
    const c: ComidaDia = {
      desayuno: plato({ kcal_estimate: 200, protein_g: 10 }),
      almuerzo: plato({ kcal_estimate: 300, protein_g: 20, fat_g: 5 }),
      cena: plato({ kcal_estimate: 100, carb_g: 15 })
    };
    expect(sumarMacrosComidaDia(c)).toEqual({
      kcal: 600,
      proteinG: 30,
      fatG: 5,
      carbG: 15,
      fiberG: 0
    });
  });
});
