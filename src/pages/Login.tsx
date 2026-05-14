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
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-6 text-sm text-amber-950 shadow-sm backdrop-blur-sm">
        <p className="font-semibold">Supabase no configurado</p>
        <p className="mt-2">
          Proyecto en{" "}
          <a className="underline" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
            Supabase
          </a>
          : <code className="rounded bg-white px-1">VITE_SUPABASE_URL</code> y{" "}
          <code className="rounded bg-white px-1">VITE_SUPABASE_ANON_KEY</code> en <code className="rounded bg-white px-1">.env</code>; SQL en{" "}
          <code className="rounded bg-white px-1">supabase/schema.sql</code>.
        </p>
      </div>
    );
  }

  /** Tras OAuth, Supabase redirige aquí; Mi plan carga el perfil remoto si hay sesión. */
  const redirectUrl = `${window.location.origin}${window.location.pathname}#/mi-plan`;

  const onEmail = async (mode: "signin" | "signup") => {
    if (!supabase) return;
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
    if (!supabase) return;
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
    <div className="ui-card mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-teal-950">Ingresar o crear cuenta</h1>
        <p className="mt-1 text-sm text-slate-600">Opcional: sincroniza el perfil (email o Google).</p>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={() => void onGoogle()}
        className="ui-btn-secondary flex w-full items-center justify-center gap-2"
      >
        Continuar con Google
      </button>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm">
          <span className="font-medium text-teal-950">Email</span>
          <input
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-teal-950">Contraseña</span>
          <input
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" disabled={loading} className="ui-btn-primary w-full">
          Entrar
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void onEmail("signup")}
          className="ui-btn-secondary w-full"
        >
          Crear cuenta
        </button>
      </form>

      {msg && (
        <p className="rounded-xl border border-teal-200/80 bg-teal-50/90 px-3 py-2 text-sm text-teal-900 shadow-sm backdrop-blur-sm">
          {msg}
        </p>
      )}
    </div>
  );
}
