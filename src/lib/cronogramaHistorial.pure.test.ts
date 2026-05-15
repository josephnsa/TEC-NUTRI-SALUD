import { describe, expect, it } from "vitest";
import { adjuntarFechasADias, stripFechaDia, type DiaPlanConFecha } from "./cronogramaHistorial";
import type { ComidaDia } from "./nutritionPlan";

function comidaMin(): ComidaDia {
  const p = { titulo: "x", receta: "y", videoQuery: "z" };
  return { desayuno: p, almuerzo: p, cena: p };
}

describe("cronogramaHistorial (puro)", () => {
  it("adjuntarFechasADias asigna fechas según inicio del perfil", () => {
    const dias = [
      { dia: 1, comidas: comidaMin() },
      { dia: 2, comidas: comidaMin() }
    ];
    const con = adjuntarFechasADias(dias, "2026-05-01", "2026-01-01");
    expect(con[0].fecha).toBe("2026-05-01");
    expect(con[1].fecha).toBe("2026-05-02");
  });

  it("adjuntarFechasADias usa fallback cuando no hay fecha de inicio", () => {
    const dias = [{ dia: 1, comidas: comidaMin() }];
    const con = adjuntarFechasADias(dias, null, "2026-12-25");
    expect(con[0].fecha).toBe("2026-12-25");
  });

  it("stripFechaDia devuelve DiaPlan sin campo fecha", () => {
    const d: DiaPlanConFecha = {
      dia: 3,
      fecha: "2026-06-10",
      comidas: comidaMin()
    };
    const s = stripFechaDia(d);
    expect(s).toEqual({ dia: 3, comidas: comidaMin() });
    expect("fecha" in s).toBe(false);
  });
});
