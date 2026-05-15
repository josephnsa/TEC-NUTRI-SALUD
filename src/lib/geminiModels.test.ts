import { describe, expect, it } from "vitest";
import { GEMINI_MODEL_IDS } from "./geminiModels";

describe("geminiModels", () => {
  it("GEMINI_MODEL_IDS es lista no vacía de strings", () => {
    expect(GEMINI_MODEL_IDS.length).toBeGreaterThan(0);
    for (const id of GEMINI_MODEL_IDS) {
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(3);
    }
  });

  it("prioriza flash recientes", () => {
    expect(GEMINI_MODEL_IDS[0]).toContain("flash");
  });
});
