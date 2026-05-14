import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase, supabaseConfigured } from "../lib/supabase";

const MIN_LEN = 6;

export function ActualizarClave() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!supabaseConfigured || !supabase) {
    return (
      <div className="ui-card mx-auto max-w-md text-sm text-amber-900">
        Supabase no está configurado; no puedes usar recuperación de contraseña desde la nube.
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!session) {
      setMsg("Enlace incompleto o caducado. Solicita uno nuevo desde Iniciar sesión.");
      return;
    }
    if (nueva.length < MIN_LEN || confirmar.length < MIN_LEN) {
      setMsg(`La contraseña debe tener al menos ${MIN_LEN} caracteres.`);
      return;
    }
    if (nueva !== confirmar) {
      setMsg("Las contraseñas no coinciden.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: nueva });
      if (error) throw error;
      setMsg("Contraseña actualizada. Ya puedes continuar.");
      setTimeout(() => navigate("/mi-plan", { replace: true }), 800);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="ui-card-muted mx-auto max-w-md text-center text-sm text-slate-600">Cargando…</div>
    );
  }

  if (!session) {
    return (
      <div className="ui-card mx-auto max-w-md space-y-4 text-sm">
        <h1 className="font-display text-xl font-bold text-teal-950">Actualizar contraseña</h1>
        <p className="text-slate-600">
          Este enlace sirve después de usar <strong>Olvidé mi contraseña</strong> desde el correo que te enviamos.
        </p>
        <Link to="/login" className="ui-btn-primary inline-flex">
          Ir a Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="ui-card mx-auto max-w-md space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-teal-950">Nueva contraseña</h1>
        <p className="mt-1 text-sm text-slate-600">
          Define una nueva contraseña para <strong>{session.user.email}</strong>.
        </p>
      </div>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
        <label className="block text-sm">
          <span className="font-medium text-teal-950">Nueva contraseña</span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={MIN_LEN}
            required
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-teal-950">Confirmar</span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={MIN_LEN}
            required
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
          />
        </label>
        <button type="submit" disabled={saving} className="ui-btn-primary w-full">
          {saving ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
      {msg && (
        <p className="rounded-xl border border-teal-200/80 bg-teal-50/90 px-3 py-2 text-sm text-teal-950">{msg}</p>
      )}
      <p className="text-center">
        <Link to="/login" className="text-xs font-semibold text-teal-800 underline decoration-teal-400/70">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
