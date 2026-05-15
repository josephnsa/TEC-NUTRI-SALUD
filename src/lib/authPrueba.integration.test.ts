/**
 * Integración opcional: login real contra Supabase del .env + config/usuario-prueba.local.json
 * Ejecutar: npm run test -- src/lib/authPrueba.integration.test.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { usuarioPruebaDesdeEnv, type UsuarioPruebaLocal } from "./pruebasUsuario";

function cargarUsuarioLocal(): UsuarioPruebaLocal | null {
  const ruta = resolve(process.cwd(), "config/usuario-prueba.local.json");
  if (existsSync(ruta)) {
    try {
      const raw = JSON.parse(readFileSync(ruta, "utf8")) as UsuarioPruebaLocal;
      if (raw.email?.trim() && raw.password) return raw;
    } catch {
      /* */
    }
  }
  return usuarioPruebaDesdeEnv();
}

const url = process.env.VITE_SUPABASE_URL ?? "";
const anon = process.env.VITE_SUPABASE_ANON_KEY ?? "";
const usuario = cargarUsuarioLocal();
const puedeProbar = Boolean(url && anon && usuario);

describe.skipIf(!puedeProbar)("auth Supabase — usuario de prueba", () => {
  it("inicia sesión con email y contraseña del fixture local", async () => {
    const u = usuario!;
    const client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data, error } = await client.auth.signInWithPassword({
      email: u.email,
      password: u.password
    });
    expect(error).toBeNull();
    expect(data.session?.access_token).toBeTruthy();
    await client.auth.signOut();
  });
});
