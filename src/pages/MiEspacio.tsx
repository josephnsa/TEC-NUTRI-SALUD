import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  PASOS_RECORRIDO_PRINCIPAL,
  PASO_ASISTENTE
} from "../lib/recorrido";
import { contarCompradosMercado } from "../lib/nutritionPlan";
import {
  getMercadoActivoParaPlan,
  getMercadoRealizado,
  listarMercadosRealizados
} from "../lib/mercadoHistorial";
import { loadPerfilLocal, perfilGuardadoEnDispositivo } from "../lib/perfilStorage";

export function MiEspacio() {
  const { user } = useAuth();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const sync = () => setTick((t) => t + 1);
    window.addEventListener("storage", sync);
    const id = window.setInterval(sync, 2500);
    return () => {
      window.removeEventListener("storage", sync);
      window.clearInterval(id);
    };
  }, []);

  const perfil = loadPerfilLocal();
  const tienePerfilLocal = perfilGuardadoEnDispositivo();
  const mercadoActivoId = getMercadoActivoParaPlan();
  const snapshotMercado = mercadoActivoId ? getMercadoRealizado(mercadoActivoId) : null;
  const nHistorial = listarMercadosRealizados().length;
  const nComprados = contarCompradosMercado(snapshotMercado?.items);

  const siguiente = useMemo(() => {
    if (!tienePerfilLocal || !perfil) {
      return { texto: "Continuar en paso 1 · Mis datos", to: "/mi-plan" as const };
    }
    if (!mercadoActivoId) {
      return { texto: "Continuar en paso 2 · Mercado keto", to: "/keto-mercado" as const };
    }
    return { texto: "Continuar en paso 3 · Cronograma", to: "/cronograma" as const };
  }, [tienePerfilLocal, perfil, mercadoActivoId]);

  void tick;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Mi resumen</p>
        <h1 className="font-display text-2xl font-bold text-teal-950 sm:text-3xl">Tu espacio</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Estado del flujo <strong>datos → mercado → menú</strong> y accesos rápidos.
        </p>
      </header>

      {user && (
        <p className="rounded-xl border border-teal-200/80 bg-teal-50/90 px-4 py-2 text-sm text-teal-900 shadow-sm backdrop-blur-sm">
          Sesión: <strong>{user.email ?? user.id}</strong>
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <section className="ui-card-muted">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Paso 1 · Datos</p>
          {!tienePerfilLocal || !perfil ? (
            <>
              <p className="mt-2 text-sm text-slate-700">Aún no hay perfil guardado en este dispositivo.</p>
              <Link to="/mi-plan" className="ui-btn-primary mt-4 inline-flex">
                Ir a Mis datos
              </Link>
            </>
          ) : (
            <>
              <ul className="mt-3 space-y-1 text-sm text-slate-800">
                {perfil.nombre.trim() ? (
                  <li>
                    <span className="text-slate-500">Nombre:</span> {perfil.nombre.trim()}
                  </li>
                ) : null}
                <li>
                  <span className="text-slate-500">Estilo:</span> {perfil.estiloDieta}
                </li>
                <li>
                  <span className="text-slate-500">Edad / peso:</span> {perfil.edad} años · {perfil.pesoKg} kg
                </li>
                <li>
                  <span className="text-slate-500">Talla:</span> {perfil.tallaCm} cm
                </li>
              </ul>
              <Link
                to="/mi-plan"
                className="mt-4 inline-block text-sm font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
              >
                Editar perfil →
              </Link>
            </>
          )}
        </section>

        <section className="ui-card-muted">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-800">Paso 2 · Mercado</p>
          {!snapshotMercado ? (
            <>
              <p className="mt-2 text-sm text-slate-700">Sin mercado activo para el plan.</p>
              {nHistorial > 0 && <p className="mt-1 text-xs text-slate-500">Historial: {nHistorial}</p>}
              <Link to="/keto-mercado" className="ui-btn-primary mt-4 inline-flex">
                Ir al mercado
              </Link>
            </>
          ) : (
            <>
              <ul className="mt-3 space-y-1 text-sm text-slate-800">
                <li>
                  <span className="text-slate-500">Guardado:</span>{" "}
                  {new Date(snapshotMercado.createdAt).toLocaleString("es")}
                </li>
                <li>
                  <span className="text-slate-500">Periodo:</span> {snapshotMercado.dias} días · {snapshotMercado.personas}{" "}
                  personas
                </li>
                <li>
                  <span className="text-slate-500">Comprados:</span> {nComprados} ítems
                </li>
              </ul>
              <Link
                to="/keto-mercado"
                className="mt-4 inline-block text-sm font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
              >
                Editar o cambiar mercado →
              </Link>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-violet-200/80 bg-gradient-to-b from-violet-50/85 to-white/95 p-5 shadow-md shadow-violet-900/5 backdrop-blur-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-900">Paso 3 · Menú</p>
          <p className="mt-2 text-sm text-slate-700">Plantillas o IA; video por plato.</p>
          <Link to="/cronograma" className="ui-btn-violet mt-4 inline-flex">
            Abrir cronograma
          </Link>
          <Link
            to={PASO_ASISTENTE.to}
            className="mt-3 block text-xs font-semibold text-violet-900 underline decoration-violet-400/60 hover:decoration-violet-700"
          >
            Asistente (opcional) →
          </Link>
        </section>
      </div>

      <section className="rounded-2xl border border-dashed border-emerald-300/70 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
        <p className="text-sm font-semibold text-teal-950">Siguiente paso sugerido</p>
        <Link to={siguiente.to} className="ui-btn-primary mt-3 inline-flex px-5 py-3">
          {siguiente.texto}
        </Link>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
          <Link
            to="/mi-plan"
            className="text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
          >
            Paso 1
          </Link>
          <span className="text-slate-300">·</span>
          <Link
            to="/keto-mercado"
            className="text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
          >
            Paso 2
          </Link>
          <span className="text-slate-300">·</span>
          <Link
            to="/cronograma"
            className="text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
          >
            Paso 3
          </Link>
        </div>
      </section>

      <nav className="ui-card text-sm" aria-label="Ir a secciones">
        <p className="font-medium text-teal-950">Accesos del recorrido</p>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {PASOS_RECORRIDO_PRINCIPAL.map((p) => (
            <li key={p.to}>
              <Link
                to={p.to}
                className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
              >
                {p.navDesktop}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/belleza"
              className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
            >
              Belleza
            </Link>
          </li>
          <li>
            <Link
              to={PASO_ASISTENTE.to}
              className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
            >
              Asistente
            </Link>
          </li>
          <li>
            <Link to="/" className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700">
              Inicio
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
