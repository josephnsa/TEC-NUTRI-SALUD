import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, supabaseConfigured } from "../lib/supabase";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!supabaseConfigured || !supabase) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <p className="font-semibold">Supabase no configurado</p>
        <p className="mt-2">
          Crea un proyecto gratuito en{" "}
          <a className="underline" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
            supabase.com
          </a>
          , copia URL y anon key en un archivo <code className="rounded bg-white px-1">.env</code> como{" "}
          <code className="rounded bg-white px-1">VITE_SUPABASE_URL</code> y{" "}
          <code className="rounded bg-white px-1">VITE_SUPABASE_ANON_KEY</code>, ejecuta el SQL de{" "}
          <code className="rounded bg-white px-1">supabase/schema.sql</code> y vuelve a cargar la app.
        </p>
      </div>
    );
  }

  const redirectUrl = `${window.location.origin}${window.location.pathname}#/`;

  const onEmail = async (mode: "signin" | "signup") => {
    setLoading(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Revisa tu correo si la confirmación está activada en Supabase.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/mi-plan");
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl }
      });
      if (error) throw error;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error con Google");
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void onEmail("signin");
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-leaf-100 bg-white p-6 shadow-sm">
      <div>
        <h1 className="font-display text-2xl font-bold text-leaf-900">Entrar o registrarse</h1>
        <p className="mt-1 text-sm text-slate-600">Cuenta gratuita con Supabase (email o Google).</p>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={() => void onGoogle()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
      >
        Continuar con Google
      </button>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm">
          <span className="font-medium">Email</span>
          <input
            type="email"
            required
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Contraseña</span>
          <input
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-leaf-700 py-2 text-sm font-semibold text-white hover:bg-leaf-900 disabled:opacity-60"
        >
          Entrar
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void onEmail("signup")}
          className="w-full rounded-xl border border-leaf-200 py-2 text-sm font-semibold text-leaf-900 hover:bg-leaf-50"
        >
          Crear cuenta
        </button>
      </form>

      {msg && <p className="text-sm text-slate-700">{msg}</p>}
    </div>
  );
}
