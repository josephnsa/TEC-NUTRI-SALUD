// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest";
import {
  esRetornoOAuthEnUrl,
  limpiarUrlTrasOAuth,
  parametrosOAuthEnUrl,
  urlRedireccionOAuth
} from "./authOAuth";

describe("authOAuth", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/TEC-NUTRI-SALUD/#/login");
  });

  it("urlRedireccionOAuth sin hash ni query", () => {
    expect(urlRedireccionOAuth()).toMatch(/\/TEC-NUTRI-SALUD\/$/);
    expect(urlRedireccionOAuth()).not.toContain("#");
    expect(urlRedireccionOAuth()).not.toContain("?");
  });

  it("detecta code en search", () => {
    window.history.replaceState({}, "", "/TEC-NUTRI-SALUD/?code=abc#/login");
    expect(esRetornoOAuthEnUrl()).toBe(true);
    expect(parametrosOAuthEnUrl()?.get("code")).toBe("abc");
  });

  it("detecta access_token con doble hash (producción legacy)", () => {
    window.history.replaceState(
      {},
      "",
      "/TEC-NUTRI-SALUD/#/mi-plan#access_token=at&refresh_token=rt&token_type=bearer"
    );
    expect(esRetornoOAuthEnUrl()).toBe(true);
    expect(parametrosOAuthEnUrl()?.get("access_token")).toBe("at");
    expect(parametrosOAuthEnUrl()?.get("refresh_token")).toBe("rt");
  });

  it("limpiarUrlTrasOAuth deja solo el hash de ruta", () => {
    window.history.replaceState({}, "", "/TEC-NUTRI-SALUD/?code=abc");
    limpiarUrlTrasOAuth("#/mi-plan");
    expect(window.location.pathname).toBe("/TEC-NUTRI-SALUD/");
    expect(window.location.hash).toBe("#/mi-plan");
    expect(window.location.search).toBe("");
  });
});
