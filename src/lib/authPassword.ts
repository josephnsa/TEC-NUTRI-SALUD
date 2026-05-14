import type { User } from "@supabase/supabase-js";

/** Cuentas creadas con email/contraseña (no solo OAuth como Google). */
export function usuarioTieneProveedorEmail(user: User | null): boolean {
  if (!user?.identities?.length) return false;
  return user.identities.some((i) => i.provider === "email");
}

/** `redirectTo` para `resetPasswordForEmail` compatible con HashRouter (#/actualizar-clave). */
export function urlRedireccionRecuperacionClave(): string {
  const u = new URL(window.location.href);
  u.hash = "#/actualizar-clave";
  return u.href;
}
