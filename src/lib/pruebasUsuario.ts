/**
 * Usuario de pruebas locales (login Supabase).
 * Datos en config/usuario-prueba.local.json (no se sube a Git).
 * Solo importar desde tests o scripts Node, no desde UI de producción.
 */

export type UsuarioPruebaLocal = {
  email: string;
  password: string;
  nombre?: string;
};

/** Credenciales desde variables E2E (scripts) o null. */
export function usuarioPruebaDesdeEnv(): UsuarioPruebaLocal | null {
  const email = process.env.E2E_TEST_EMAIL?.trim();
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}
