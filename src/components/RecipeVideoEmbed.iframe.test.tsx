/** @vitest-environment happy-dom */
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecipeVideoEmbed } from "./RecipeVideoEmbed";

vi.mock("../lib/recipeVideoResolve", () => ({
  asegurarVideoEmbebible: vi.fn()
}));

describe("RecipeVideoEmbed iframe en página", () => {
  let host: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  afterEach(() => {
    root?.unmount();
    host?.remove();
  });

  it("muestra iframe youtube-nocookie si la URL ya está validada", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    root.render(
      <RecipeVideoEmbed
        playUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        title="Tortilla keto"
        urlYaValidada
      />
    );
    await new Promise((r) => setTimeout(r, 0));

    const iframe = document.querySelector('iframe[src*="youtube-nocookie.com/embed/dQw4w9WgXcQ"]');
    expect(iframe).not.toBeNull();
    expect(document.body.textContent).toMatch(/Reproduce el tutorial aquí/i);
    expect(document.body.textContent).not.toMatch(/Ver receta en vídeo/i);
  });
});
