import { describe, expect, it } from "vitest";
import { parseEstadoPerfilesFromUnknown } from "./perfilStorage";

describe("perfilStorage.parseEstadoPerfilesFromUnknown", () => {
  const miembroMin = {
    id: "id-1",
    creadoEn: "2026-05-01T12:00:00.000Z",
    nombre: "Ana",
    edad: 35,
    pesoKg: 68,
    tallaCm: 162,
    sexo: "f",
    enfermedades: "",
    alimentosEvitar: "",
    estiloDieta: "mediterranea",
    fechaInicioPlan: "2026-05-13"
  };

  it("rechaza raíz inválida", () => {
    expect(parseEstadoPerfilesFromUnknown(null)).toBeNull();
    expect(parseEstadoPerfilesFromUnknown({})).toBeNull();
    expect(parseEstadoPerfilesFromUnknown({ perfiles: [], activoId: "x" })).toBeNull();
    expect(parseEstadoPerfilesFromUnknown({ perfiles: [{}], activoId: "x" })).toBeNull();
  });

  it("parsea estado válido", () => {
    const e = parseEstadoPerfilesFromUnknown({
      perfiles: [miembroMin],
      activoId: "id-1"
    });
    expect(e).not.toBeNull();
    expect(e!.activoId).toBe("id-1");
    expect(e!.perfiles).toHaveLength(1);
    expect(e!.perfiles[0].nombre).toBe("Ana");
    expect(e!.perfiles[0].estiloDieta).toBe("mediterranea");
    expect(e!.perfiles[0].fechaInicioPlan).toBe("2026-05-13");
  });

  it("corrige activoId si no coincide con ningún perfil", () => {
    const e = parseEstadoPerfilesFromUnknown({
      perfiles: [miembroMin],
      activoId: "no-existe"
    });
    expect(e!.activoId).toBe("id-1");
  });
});
