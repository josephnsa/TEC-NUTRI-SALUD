import { describe, expect, it } from "vitest";
import { contarCompradosMercado } from "./nutritionPlan";
import type { ListaItem } from "./ketoMercado";

function item(comprado: boolean): ListaItem {
  return {
    id: "x",
    nombre: "n",
    unidad: "g",
    basePorPersonaDia: 1,
    categoria: "verdura",
    cantidad: 50,
    comprado
  };
}

describe("contarCompradosMercado", () => {
  it("devuelve 0 sin lista o vacía", () => {
    expect(contarCompradosMercado(undefined)).toBe(0);
    expect(contarCompradosMercado([])).toBe(0);
  });

  it("cuenta solo ítems marcados comprados", () => {
    expect(contarCompradosMercado([item(false)])).toBe(0);
    expect(contarCompradosMercado([item(true), item(false), item(true)])).toBe(2);
  });
});
