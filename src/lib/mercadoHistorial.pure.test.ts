import { describe, expect, it } from "vitest";
import { activeMercadoStorageKey, contarComprados } from "./mercadoHistorial";
import type { ListaItem } from "./ketoMercado";

function item(comprado: boolean): ListaItem {
  return {
    id: "test-item",
    nombre: "Ítem test",
    unidad: "g",
    basePorPersonaDia: 100,
    categoria: "proteina",
    cantidad: 200,
    comprado
  };
}

describe("mercadoHistorial (puro)", () => {
  it("activeMercadoStorageKey incluye perfilId", () => {
    expect(activeMercadoStorageKey("abc-123")).toBe(
      "tec_nutri_salud_mercado_activo_plan_id_v1__abc-123"
    );
  });

  it("contarComprados cuenta solo comprados", () => {
    expect(contarComprados([])).toBe(0);
    expect(contarComprados([item(false), item(false)])).toBe(0);
    expect(contarComprados([item(true), item(false), item(true)])).toBe(2);
  });
});
