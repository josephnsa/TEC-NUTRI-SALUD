import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { usuarioTieneProveedorEmail } from "./authPassword";

describe("usuarioTieneProveedorEmail", () => {
  it("falso sin usuario o sin identidades", () => {
    expect(usuarioTieneProveedorEmail(null)).toBe(false);
    expect(usuarioTieneProveedorEmail({ identities: undefined } as unknown as User)).toBe(false);
    expect(usuarioTieneProveedorEmail({ identities: [] } as unknown as User)).toBe(false);
  });

  it("verdadero si hay proveedor email", () => {
    const user = { identities: [{ provider: "email" }] } as unknown as User;
    expect(usuarioTieneProveedorEmail(user)).toBe(true);
  });

  it("falso solo con OAuth", () => {
    const user = { identities: [{ provider: "google" }] } as unknown as User;
    expect(usuarioTieneProveedorEmail(user)).toBe(false);
  });

  it("verdadero si una de varias identidades es email", () => {
    const user = {
      identities: [{ provider: "google" }, { provider: "email" }]
    } as unknown as User;
    expect(usuarioTieneProveedorEmail(user)).toBe(true);
  });
});
