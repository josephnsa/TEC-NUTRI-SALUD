import { describe, expect, it } from "vitest";
import { PASOS_RECORRIDO_PRINCIPAL, PASO_ASISTENTE, RUTA_MI_ESPACIO } from "./recorrido";

describe("recorrido", () => {
  it("define tres pasos principales en orden datos → mercado → menú", () => {
    expect(PASOS_RECORRIDO_PRINCIPAL).toHaveLength(3);
    expect(PASOS_RECORRIDO_PRINCIPAL[0]?.paso).toBe(1);
    expect(PASOS_RECORRIDO_PRINCIPAL[0]?.to).toBe("/mi-plan");
    expect(PASOS_RECORRIDO_PRINCIPAL[1]?.to).toBe("/keto-mercado");
    expect(PASOS_RECORRIDO_PRINCIPAL[1]?.tituloPagina).toMatch(/Mi mercado/i);
    expect(PASOS_RECORRIDO_PRINCIPAL[2]?.to).toBe("/cronograma");
  });

  it("PASO_ASISTENTE apunta a agente", () => {
    expect(PASO_ASISTENTE.to).toBe("/agente");
    expect(PASO_ASISTENTE.navCorto).toBeTruthy();
  });

  it("RUTA_MI_ESPACIO es espacio resumen", () => {
    expect(RUTA_MI_ESPACIO).toBe("/mi-espacio");
  });
});
