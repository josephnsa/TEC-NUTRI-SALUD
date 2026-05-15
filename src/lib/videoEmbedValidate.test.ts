/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockOembed } = vi.hoisted(() => ({
  mockOembed: vi.fn().mockResolvedValue(true)
}));

vi.mock("./youtubeEmbed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./youtubeEmbed")>();
  return {
    ...actual,
    youtubeOembedDisponible: mockOembed,
    youtubeVideoVerificado: vi.fn().mockResolvedValue(true)
  };
});

import { primerVideoEmbebibleValido, validarVideoEmbebible } from "./videoEmbedValidate";

describe("validarVideoEmbebible", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockOembed.mockResolvedValue(true);
  });

  it("rechaza URL vacía o no reproducible", async () => {
    expect(await validarVideoEmbebible("")).toBe(false);
    expect(await validarVideoEmbebible("https://example.com/not-a-video")).toBe(false);
  });

  it("acepta YouTube en navegador con oEmbed ok", async () => {
    const ok = await validarVideoEmbebible("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(mockOembed).toHaveBeenCalledWith("dQw4w9WgXcQ");
    expect(ok).toBe(true);
  });
});

describe("primerVideoEmbebibleValido", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve el primer candidato válido", async () => {
    mockOembed.mockImplementation(async (id: string) => id === "dQw4w9WgXcQ");

    const url = await primerVideoEmbebibleValido([
      "https://www.youtube.com/watch?v=badbadbadba",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ]);
    expect(url).toContain("youtube.com/watch");
    expect(url).toContain("dQw4w9WgXcQ");
  });
});
