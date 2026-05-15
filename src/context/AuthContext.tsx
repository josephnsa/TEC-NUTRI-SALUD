import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { useNavigate } from "react-router-dom";
import type { Session, User } from "@supabase/supabase-js";
import {
  esRetornoOAuthEnUrl,
  limpiarUrlTrasOAuth,
  restaurarSesionOAuthDesdeUrl
} from "../lib/authOAuth";
import { supabase, supabaseConfigured } from "../lib/supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isConfigured: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    void (async () => {
      if (esRetornoOAuthEnUrl()) {
        await restaurarSesionOAuthDesdeUrl(supabase);
      }
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      if (data.session && esRetornoOAuthEnUrl()) {
        limpiarUrlTrasOAuth("#/mi-plan");
        navigate("/mi-plan", { replace: true });
      }
      setLoading(false);
    })();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_IN" && next && esRetornoOAuthEnUrl()) {
        limpiarUrlTrasOAuth("#/mi-plan");
        navigate("/mi-plan", { replace: true });
      }
      if (event === "PASSWORD_RECOVERY") {
        navigate("/actualizar-clave", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    // Solo borra datos locales cuando hay cuenta Supabase (están respaldados en la nube)
    if (supabaseConfigured) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith("tec_nutri_salud_")) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      // Notificar componentes reactivos para que se actualicen
      try {
        window.dispatchEvent(new CustomEvent("tec-nutri-salud-perfiles", { detail: {} }));
        window.dispatchEvent(new CustomEvent("tec-nutri-salud-cronograma-historial", { detail: {} }));
      } catch { /* ignore */ }
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signOut,
      isConfigured: supabaseConfigured
    }),
    [session, loading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth dentro de AuthProvider");
  return ctx;
}
