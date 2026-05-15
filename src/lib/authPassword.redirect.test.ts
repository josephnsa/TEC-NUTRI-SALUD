// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest";
import { urlRedireccionRecuperacionClave } from "./authPassword";

describe("urlRedireccionRecuperacionClave", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/TEC-NUTRI-SALUD/#/login?next=1");
  });

  it("conserva origen y path y fuerza hash #/actualizar-clave", () => {
    const out = urlRedireccionRecuperacionClave();
    expect(out.endsWith("/TEC-NUTRI-SALUD/#/actualizar-clave")).toBe(true);
    expect(out.includes("#/login")).toBe(false);
  });
});
