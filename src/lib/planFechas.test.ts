import { describe, expect, it } from "vitest";
import {
  fechaInicioEfectivaParaDias,
  fechaIsoParaDiaN,
  etiquetaFechaDiaPlan,
  toYmdLocal
} from "./planFechas";

describe("planFechas", () => {
  it("fechaIsoParaDiaN numera desde el día 1", () => {
    expect(fechaIsoParaDiaN("2026-05-01", 1)).toBe("2026-05-01");
    expect(fechaIsoParaDiaN("2026-05-01", 3)).toBe("2026-05-03");
    expect(fechaIsoParaDiaN("2026-05-30", 3)).toBe("2026-06-01");
  });

  it("fechaIsoParaDiaN rechaza fecha inválida", () => {
    expect(fechaIsoParaDiaN("no-iso", 1)).toBeNull();
    expect(fechaIsoParaDiaN("", 1)).toBeNull();
  });

  it("etiquetaFechaDiaPlan devuelve null sin inicio válido", () => {
    expect(etiquetaFechaDiaPlan(null, 1)).toBeNull();
    expect(etiquetaFechaDiaPlan("xyz", 2)).toBeNull();
  });

  it("etiquetaFechaDiaPlan formatea cuando hay inicio válido", () => {
    const s = etiquetaFechaDiaPlan("2026-05-01", 1);
    expect(s).toBeTruthy();
    expect(String(s).length).toBeGreaterThan(2);
  });

  it("fechaInicioEfectivaParaDias prioriza fecha del perfil", () => {
    expect(fechaInicioEfectivaParaDias("2026-03-10")).toBe("2026-03-10");
    expect(fechaInicioEfectivaParaDias("2026-03-10", "2026-01-01")).toBe("2026-03-10");
  });

  it("fechaInicioEfectivaParaDias usa fallback ISO válido", () => {
    expect(fechaInicioEfectivaParaDias(null, "2026-04-15")).toBe("2026-04-15");
    expect(fechaInicioEfectivaParaDias(undefined, "2026-04-15")).toBe("2026-04-15");
  });

  it("fechaInicioEfectivaParaDias ignora fallback mal formado", () => {
    const got = fechaInicioEfectivaParaDias(null, "no-valid");
    expect(got).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("toYmdLocal forma YYYY-MM-DD", () => {
    expect(toYmdLocal(new Date(2026, 4, 7))).toBe("2026-05-07");
  });
});
