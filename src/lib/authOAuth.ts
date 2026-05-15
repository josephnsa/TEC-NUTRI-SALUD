import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * OAuth con HashRouter: redirectTo sin `#/ruta` para que Supabase devuelva `?code=`
 * en search (PKCE). Si redirectTo lleva `#/mi-plan`, Supabase puede devolver
 * `#/mi-plan#access_token=...` y hay que parsearlo a mano.
 * @see https://github.com/supabase/supabase/issues/23704
 */

/** URL base (origen + path) sin hash ni query — va en `redirectTo` de signInWithOAuth. */
export function urlRedireccionOAuth(): string {
  const u = new URL(window.location.href);
  u.hash = "";
  u.search = "";
  return `${u.origin}${u.pathname}`;
}

/** Parámetros OAuth en search (`?code=`) o en hash (`#access_token=` o doble `#`). */
export function parametrosOAuthEnUrl(): URLSearchParams | null {
  const { search, hash } = window.location;
  if (
    search.includes("code=") ||
    search.includes("error=") ||
    search.includes("access_token=")
  ) {
    return new URLSearchParams(search);
  }
  if (!hash) return null;

  const tokenAt = hash.indexOf("access_token=");
  const errAt = hash.indexOf("error=");
  if (tokenAt === -1 && errAt === -1) return null;

  const start = tokenAt >= 0 ? tokenAt : errAt;
  return new URLSearchParams(hash.slice(start));
}

/** Indica si la URL actual parece un retorno de OAuth (código o tokens). */
export function esRetornoOAuthEnUrl(): boolean {
  return parametrosOAuthEnUrl() !== null;
}

/** Deja solo la ruta hash de la SPA tras procesar la sesión. */
export function limpiarUrlTrasOAuth(rutaHash = "#/mi-plan"): void {
  const base = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, document.title, `${base}${rutaHash}`);
}

/**
 * Antes del primer render: convierte `#/ruta#access_token=...` en `?tokens#/auth/callback`
 * para que HashRouter no interprete una ruta inválida (flash 404).
 */
export function normalizarUrlRetornoOAuth(): void {
  const { origin, pathname, search, hash } = window.location;
  const base = `${origin}${pathname}`;
  const destinoHash = "#/auth/callback";

  const segundoHash = hash.indexOf("#", 1);
  if (
    segundoHash > 0 &&
    (hash.includes("access_token=") || hash.includes("error="))
  ) {
    const tokenParams = hash.slice(segundoHash + 1);
    window.history.replaceState({}, document.title, `${base}?${tokenParams}${destinoHash}`);
    return;
  }

  if (search.includes("code=") || search.includes("error=")) {
    if (hash !== destinoHash) {
      window.history.replaceState({}, document.title, `${base}${search}${destinoHash}`);
    }
    return;
  }

  if (hash.startsWith("#access_token=") || hash.startsWith("#error=")) {
    const tokenParams = hash.slice(1);
    window.history.replaceState({}, document.title, `${base}?${tokenParams}${destinoHash}`);
  }
}

/**
 * Supabase `detectSessionInUrl` no siempre lee `#/ruta#access_token=...`.
 * Restaura sesión desde query o hash antes de `getSession()`.
 */
export async function restaurarSesionOAuthDesdeUrl(client: SupabaseClient): Promise<boolean> {
  const params = parametrosOAuthEnUrl();
  if (!params) return false;

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (accessToken && refreshToken) {
    const { data, error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    return !error && Boolean(data.session);
  }

  const code = params.get("code");
  if (code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    return !error && Boolean(data.session);
  }

  return false;
}
