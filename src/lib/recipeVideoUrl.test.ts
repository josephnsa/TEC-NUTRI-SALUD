import { describe, expect, it } from "vitest";
import {
  detectRecipeVideoPlatform,
  urlReproducibleDesdePlato,
  urlReproducibleReceta
} from "./recipeVideoUrl";

describe("recipeVideoUrl", () => {
  it("detecta YouTube y TikTok", () => {
    expect(detectRecipeVideoPlatform("https://www.youtube.com/watch?v=abc")).toBe("youtube");
    expect(detectRecipeVideoPlatform("https://www.tiktok.com/@chef/video/123")).toBe("tiktok");
  });

  it("normaliza ID YouTube a URL watch", () => {
    expect(urlReproducibleReceta("dQw4w9WgXcQ")).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });

  it("acepta URL TikTok", () => {
    const u = "https://www.tiktok.com/@user/video/7123456789";
    expect(urlReproducibleReceta(u)).toBe(u);
  });

  it("urlReproducibleDesdePlato prioriza videoUrl", () => {
    const u = urlReproducibleDesdePlato({
      videoUrl: "https://www.tiktok.com/@chef/video/1",
      youtubeVideoId: null
    });
    expect(u).toContain("tiktok.com");
  });
});
