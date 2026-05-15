import { FormEvent, useState, useId } from "react";
import { useNavigate } from "react-router-dom";
import { urlRedireccionRecuperacionClave } from "../lib/authPassword";
import { supabase, supabaseConfigured } from "../lib/supabase";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);
  const [verClave, setVerClave] = useState(false);
  const pwdId = useId();

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

  const onRecuperarClave = async () => {
    if (!supabase) return;
    const mail = email.trim();
    if (!mail) {
      setMsg("Escribe tu correo arriba o aquí mismo para enviarte el enlace.");
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(mail, {
        redirectTo: urlRedireccionRecuperacionClave()
      });
      if (error) throw error;
      setMsg("Si ese correo está registrado, recibirás un enlace para elegir nueva contraseña.");
      setMostrarRecuperacion(false);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "No se pudo enviar el correo.");
    } finally {
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
        <div className="block text-sm">
          <label htmlFor={pwdId} className="font-medium text-teal-950">Contraseña</label>
          <div className="relative mt-1">
            <input
              id={pwdId}
              type={verClave ? "text" : "password"}
              required
              minLength={6}
              className="w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 pr-10 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setVerClave((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:text-teal-700"
            >
              {verClave ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clipRule="evenodd" />
                  <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setMostrarRecuperacion((v) => !v);
              setMsg(null);
            }}
            className="text-xs font-semibold text-teal-800 underline decoration-teal-400/70 hover:text-teal-950"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
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

      {mostrarRecuperacion && (
        <div className="rounded-xl border border-violet-200/80 bg-violet-50/70 p-4 text-sm text-slate-800">
          <p className="font-medium text-violet-950">Recuperar acceso</p>
          <p className="mt-2 text-xs text-slate-600">
            Usamos el mismo correo del formulario. En Supabase debes tener permitida la URL de redirección (ver{" "}
            <code className="rounded bg-white/80 px-1">docs/DEPLOYMENT.md</code>).
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onRecuperarClave()}
            className="ui-btn-secondary mt-3 w-full text-xs"
          >
            Enviar enlace a mi correo
          </button>
        </div>
      )}

      {msg && (
        <p className="rounded-xl border border-teal-200/80 bg-teal-50/90 px-3 py-2 text-sm text-teal-900 shadow-sm backdrop-blur-sm">
          {msg}
        </p>
      )}
    </div>
  );
}
