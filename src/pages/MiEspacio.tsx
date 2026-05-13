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
        <h1 className="font-display text-2xl font-bold text-leaf-900 sm:text-3xl">Tu espacio</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Vista rápida del recorrido <strong>datos → mercado → menú</strong>. Los detalles están en cada paso; aquí solo
          ves el estado y los accesos directos.
        </p>
      </header>

      {user && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
          Sesión: <strong>{user.email ?? user.id}</strong>
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/90 to-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Paso 1 · Datos</p>
          {!tienePerfilLocal || !perfil ? (
            <>
              <p className="mt-2 text-sm text-slate-700">Aún no hay perfil guardado en este dispositivo.</p>
              <Link
                to="/mi-plan"
                className="mt-4 inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                Ir a Mis datos
              </Link>
            </>
          ) : (
            <>
              <ul className="mt-3 space-y-1 text-sm text-slate-800">
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
              <Link to="/mi-plan" className="mt-4 inline-block text-sm font-semibold text-emerald-800 underline">
                Editar perfil →
              </Link>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50/90 to-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-800">Paso 2 · Mercado</p>
          {!snapshotMercado ? (
            <>
              <p className="mt-2 text-sm text-slate-700">Sin mercado activo para el plan.</p>
              {nHistorial > 0 && (
                <p className="mt-1 text-xs text-slate-500">Tienes {nHistorial} entrada(s) en historial local.</p>
              )}
              <Link
                to="/keto-mercado"
                className="mt-4 inline-flex rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-950"
              >
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
              <Link to="/keto-mercado" className="mt-4 inline-block text-sm font-semibold text-teal-900 underline">
                Editar o cambiar mercado →
              </Link>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-violet-100 bg-gradient-to-b from-violet-50/80 to-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-900">Paso 3 · Menú</p>
          <p className="mt-2 text-sm text-slate-700">
            Genera plantillas o recetas con IA, modo perfil/mercado/mixto y enlaces a video por plato.
          </p>
          <Link
            to="/cronograma"
            className="mt-4 inline-flex rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-900"
          >
            Abrir cronograma
          </Link>
          <Link to={PASO_ASISTENTE.to} className="mt-3 block text-xs font-semibold text-violet-800 underline">
            Asistente IA (opcional) →
          </Link>
        </section>
      </div>

      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-5">
        <p className="text-sm font-semibold text-slate-800">Siguiente paso sugerido</p>
        <Link
          to={siguiente.to}
          className="mt-3 inline-flex rounded-xl bg-leaf-700 px-5 py-3 text-sm font-bold text-white shadow hover:bg-leaf-900"
        >
          {siguiente.texto}
        </Link>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
          <Link to="/mi-plan" className="underline hover:text-leaf-900">
            Paso 1
          </Link>
          <span className="text-slate-300">·</span>
          <Link to="/keto-mercado" className="underline hover:text-leaf-900">
            Paso 2
          </Link>
          <span className="text-slate-300">·</span>
          <Link to="/cronograma" className="underline hover:text-leaf-900">
            Paso 3
          </Link>
        </div>
      </section>

      <nav className="rounded-2xl border border-leaf-100 bg-white p-4 text-sm shadow-sm" aria-label="Ir a secciones">
        <p className="font-medium text-slate-700">Accesos del recorrido</p>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-emerald-800">
          {PASOS_RECORRIDO_PRINCIPAL.map((p) => (
            <li key={p.to}>
              <Link to={p.to} className="font-semibold underline hover:no-underline">
                {p.navDesktop}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/belleza" className="font-semibold underline hover:no-underline">
              Belleza
            </Link>
          </li>
          <li>
            <Link to={PASO_ASISTENTE.to} className="font-semibold underline hover:no-underline">
              Asistente
            </Link>
          </li>
          <li>
            <Link to="/" className="font-semibold underline hover:no-underline">
              Inicio
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
