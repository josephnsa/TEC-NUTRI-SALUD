/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockPrimerValido, mockValidar } = vi.hoisted(() => ({
  mockValidar: vi.fn().mockResolvedValue(true),
  mockPrimerValido: vi.fn()
}));

vi.mock("./videoEmbedValidate", () => ({
  validarVideoEmbebible: mockValidar,
  primerVideoEmbebibleValido: mockPrimerValido
}));

import { buscarVideoParaReceta } from "./recipeVideoResolve";

describe("buscarVideoParaReceta", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("usa caché local tras primera búsqueda validada", async () => {
    const urlEsperada = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    mockPrimerValido.mockResolvedValue(urlEsperada);

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/search")) {
        return {
          ok: true,
          json: async () => [{ type: "video", videoId: "dQw4w9WgXcQ" }]
        };
      }
      return { ok: false };
    });
    vi.stubGlobal("fetch", fetchMock);

    const url1 = await buscarVideoParaReceta("Tortilla keto", "tortilla huevo");
    expect(url1).toBe(urlEsperada);

    mockPrimerValido.mockClear();
    fetchMock.mockClear();

    const url2 = await buscarVideoParaReceta("Tortilla keto", "tortilla huevo");
    expect(url2).toBe(url1);
    expect(mockPrimerValido).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
