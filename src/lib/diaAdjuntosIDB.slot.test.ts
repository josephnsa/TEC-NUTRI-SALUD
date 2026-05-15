import { describe, expect, it } from "vitest";
import { normalizeMediaSlot } from "./diaAdjuntosIDB";

describe("normalizeMediaSlot", () => {
  it("acepta slots válidos", () => {
    expect(normalizeMediaSlot("desayuno")).toBe("desayuno");
    expect(normalizeMediaSlot("almuerzo")).toBe("almuerzo");
    expect(normalizeMediaSlot("cena")).toBe("cena");
    expect(normalizeMediaSlot("general")).toBe("general");
  });

  it("cae en general ante valores desconocidos", () => {
    expect(normalizeMediaSlot("")).toBe("general");
    expect(normalizeMediaSlot("merienda")).toBe("general");
    expect(normalizeMediaSlot(null)).toBe("general");
    expect(normalizeMediaSlot(undefined)).toBe("general");
  });
});
