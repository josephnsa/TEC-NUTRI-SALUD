import { describe, expect, it } from "vitest";
import { validarYExtraerRespaldoV1 } from "./backupLocal";

describe("backupLocal.validarYExtraerRespaldoV1", () => {
  it("rechaza entrada inválida", () => {
    expect(validarYExtraerRespaldoV1(null)).toBeNull();
    expect(validarYExtraerRespaldoV1(undefined)).toBeNull();
    expect(validarYExtraerRespaldoV1("string")).toBeNull();
    expect(validarYExtraerRespaldoV1([])).toBeNull();
    expect(validarYExtraerRespaldoV1({})).toBeNull();
    expect(validarYExtraerRespaldoV1({ version: 2, localStorage: {} })).toBeNull();
    expect(validarYExtraerRespaldoV1({ version: 1, localStorage: "bad" })).toBeNull();
  });

  it("acepta v1 con mapa vacío de claves app", () => {
    expect(validarYExtraerRespaldoV1({ version: 1, localStorage: {} })).toEqual({});
  });

  it("filtra solo claves tec_nutri_salud_*", () => {
    const out = validarYExtraerRespaldoV1({
      version: 1,
      localStorage: {
        other_key: "x",
        tec_nutri_salud_demo: '{"x":1}',
        tec_nutri_salud_null: null
      }
    });
    expect(out).toEqual({
      tec_nutri_salud_demo: '{"x":1}',
      tec_nutri_salud_null: null
    });
  });

  it("rechaza valores que no son string ni null", () => {
    expect(
      validarYExtraerRespaldoV1({
        version: 1,
        localStorage: { tec_nutri_salud_x: 123 as unknown as string }
      })
    ).toBeNull();
  });
});
