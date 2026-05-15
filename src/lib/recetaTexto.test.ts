import { describe, expect, it } from "vitest";
import { parseRecetaDetalle } from "./recetaTexto";

describe("parseRecetaDetalle", () => {
  it("separa ingredientes y pasos con separador estándar", () => {
    const receta =
      "Ingredientes (2 raciones): huevo, aceite · Pasos: batir huevos y cocinar en sartén.";
    expect(parseRecetaDetalle(receta)).toEqual({
      ingredientes: "huevo, aceite",
      pasos: "batir huevos y cocinar en sartén."
    });
  });

  it("devuelve solo ingredientes si no hay pasos", () => {
    const receta = "Ingredientes (1 ración): pollo, limón";
    expect(parseRecetaDetalle(receta)).toEqual({
      ingredientes: "pollo, limón",
      pasos: ""
    });
  });

  it("devuelve vacío para texto vacío", () => {
    expect(parseRecetaDetalle("   ")).toEqual({ ingredientes: "", pasos: "" });
  });
});
