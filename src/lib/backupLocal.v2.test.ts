import { describe, expect, it } from "vitest";
import { validarYExtraerRespaldoV2 } from "./backupLocal";

describe("validarYExtraerRespaldoV2", () => {
  it("rechaza version distinta de 2", () => {
    expect(validarYExtraerRespaldoV2({ version: 1, localStorage: {} })).toBeNull();
  });

  it("acepta v2 con localStorage y adjuntos opcionales", () => {
    const v = validarYExtraerRespaldoV2({
      version: 2,
      exportedAt: "2026-05-01",
      app: "tec-nutri-salud",
      localStorage: { tec_nutri_salud_demo: "{}" },
      adjuntos: [
        {
          key: "pid__2026-05-01",
          progress: [false, false, false, false, false, false],
          medias: [],
          nota: "",
          seguimientoPlan: null
        }
      ]
    });
    expect(v?.version).toBe(2);
    expect(v?.adjuntos).toHaveLength(1);
  });
});
