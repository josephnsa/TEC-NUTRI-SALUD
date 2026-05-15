/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { buscarVideoParaReceta } from "./recipeVideoResolve";

describe("buscarVideoParaReceta", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("usa caché local tras primera búsqueda", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ type: "video", videoId: "dQw4w9WgXcQ" }]
    });
    vi.stubGlobal("fetch", fetchMock);

    const url1 = await buscarVideoParaReceta("Tortilla keto", "tortilla huevo");
    expect(url1).toContain("youtube.com/watch");

    fetchMock.mockClear();
    const url2 = await buscarVideoParaReceta("Tortilla keto", "tortilla huevo");
    expect(url2).toBe(url1);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
