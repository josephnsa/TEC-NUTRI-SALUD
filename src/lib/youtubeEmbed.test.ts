import { afterEach, describe, expect, it, vi } from "vitest";
import { youtubeOembedDisponible, youtubeVideoIdFromInput } from "./youtubeEmbed";

describe("youtubeEmbed", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("extrae id de URL watch", () => {
    expect(youtubeVideoIdFromInput("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("oEmbed ok cuando la API responde 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true } as Response)
    );
    await expect(youtubeOembedDisponible("dQw4w9WgXcQ")).resolves.toBe(true);
  });

  it("oEmbed false cuando la API responde 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false } as Response)
    );
    await expect(youtubeOembedDisponible("xxxxxxxxxxx")).resolves.toBe(false);
  });
});
