import { describe, expect, it } from "vitest";
import {
  MAX_ADJUNTO_LOCAL_BYTES,
  MAX_IMAGEN_LOCAL_BYTES,
  validarArchivoAdjunto
} from "./mediaLimits";

describe("validarArchivoAdjunto", () => {
  it("rechaza tipos no imagen/video", () => {
    const f = new File(["x"], "a.txt", { type: "text/plain" });
    expect(validarArchivoAdjunto(f).ok).toBe(false);
  });

  it("acepta imagen dentro del límite", () => {
    const f = new File([new Uint8Array(100)], "f.jpg", { type: "image/jpeg" });
    expect(validarArchivoAdjunto(f)).toEqual({ ok: true });
  });

  it("rechaza imagen demasiado grande", () => {
    const f = new File([new Uint8Array(MAX_IMAGEN_LOCAL_BYTES + 1)], "big.jpg", {
      type: "image/jpeg"
    });
    expect(validarArchivoAdjunto(f).ok).toBe(false);
  });

  it("rechaza vídeo demasiado grande", () => {
    const f = new File([new Uint8Array(MAX_ADJUNTO_LOCAL_BYTES + 1)], "big.mp4", {
      type: "video/mp4"
    });
    expect(validarArchivoAdjunto(f).ok).toBe(false);
  });
});
