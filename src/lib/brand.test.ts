import { describe, expect, it } from "vitest";
import { MARCA_APP, MARCA_ESLOGAN } from "./brand";

describe("brand", () => {
  it("expone marca y eslogan no vacíos", () => {
    expect(MARCA_APP.length).toBeGreaterThan(0);
    expect(MARCA_ESLOGAN.length).toBeGreaterThan(0);
    expect(MARCA_APP).toBe("NutriSalud");
  });
});
