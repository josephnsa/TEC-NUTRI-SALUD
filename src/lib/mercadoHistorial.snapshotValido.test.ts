import { describe, expect, it } from "vitest";
import { mercadoSnapshotEsValido, type MercadoSnapshot } from "./mercadoHistorial";

describe("mercadoSnapshotEsValido", () => {
  it("rechaza valores no objeto o incompletos", () => {
    expect(mercadoSnapshotEsValido(null)).toBe(false);
    expect(mercadoSnapshotEsValido(undefined)).toBe(false);
    expect(mercadoSnapshotEsValido([])).toBe(false);
    expect(mercadoSnapshotEsValido({})).toBe(false);
    expect(
      mercadoSnapshotEsValido({
        id: "x",
        createdAt: "2026-01-01",
        dias: 7,
        personas: 2
      })
    ).toBe(false);
    expect(
      mercadoSnapshotEsValido({
        id: "x",
        createdAt: "2026-01-01",
        dias: 7,
        personas: 2,
        items: "no-array"
      })
    ).toBe(false);
  });

  it("acepta snapshot mínimo con items array", () => {
    const snap: MercadoSnapshot = {
      id: "id-1",
      createdAt: "2026-05-01T12:00:00.000Z",
      dias: 7,
      personas: 2,
      items: []
    };
    expect(mercadoSnapshotEsValido(snap)).toBe(true);
  });
});
