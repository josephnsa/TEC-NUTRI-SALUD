import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  PASOS_RECORRIDO_PRINCIPAL,
  PASO_ASISTENTE
} from "../lib/recorrido";
import { usuarioTieneProveedorEmail } from "../lib/authPassword";
import { supabase } from "../lib/supabase";
import { contarCompradosMercado } from "../lib/nutritionPlan";
import {
  getMercadoActivoParaPlan,
  getMercadoRealizado,
  listarMercadosRealizados
} from "../lib/mercadoHistorial";
import {
  contarClavesRespaldo,
  descargarRespaldoCompletoJson,
  importarRespaldoReemplazandoTodo
} from "../lib/backupLocal";
import {
  loadPerfilLocal,
  perfilGuardadoEnDispositivo,
  getActivoPerfilId,
  PERFILES_STORAGE_EVENT
} from "../lib/perfilStorage";
import {
  CRONOGRAMA_HISTORIAL_EVENT,
  getSnapshotActivoId,
  listarSnapshots,
  snapshotMasReciente
} from "../lib/cronogramaHistorial";
import { pullCloudSnapshots } from "../lib/snapshotsRemote";

export function MiEspacio() {
  const { user, isConfigured } = useAuth();
  const [tick, setTick] = useState(0);
  const [estadoImport, setEstadoImport] = useState<string | null>(null);
  const inputRespaldoRef = useRef<HTMLInputElement>(null);
  const [msgClave, setMsgClave] = useState<string | null>(null);
  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [guardandoClave, setGuardandoClave] = useState(false);
  const [msgSyncNube, setMsgSyncNube] = useState<string | null>(null);
  const [syncNubeCargando, setSyncNubeCargando] = useState(false);

  useEffect(() => {
    const sync = () => setTick((t) => t + 1);
    window.addEventListener("storage", sync);
    window.addEventListener(PERFILES_STORAGE_EVENT, sync);
    window.addEventListener(CRONOGRAMA_HISTORIAL_EVENT, sync);
    const id = window.setInterval(sync, 2500);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PERFILES_STORAGE_EVENT, sync);
      window.removeEventListener(CRONOGRAMA_HISTORIAL_EVENT, sync);
      window.clearInterval(id);
    };
  }, []);

  const perfil = loadPerfilLocal();
  const tienePerfilLocal = perfilGuardadoEnDispositivo();
  const mercadoActivoId = getMercadoActivoParaPlan();
  const snapshotMercado = mercadoActivoId ? getMercadoRealizado(mercadoActivoId) : null;
  const nHistorial = listarMercadosRealizados().length;
  const nComprados = contarCompradosMercado(snapshotMercado?.items);

  const perfilId = getActivoPerfilId();
  const snapActivoCronId = getSnapshotActivoId(perfilId);
  const snapCron = snapActivoCronId
    ? (listarSnapshots(perfilId).find((s) => s.id === snapActivoCronId) ?? null)
    : snapshotMasReciente(perfilId);

  void tick;

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

      {user && isConfigured && supabase && (
        <section className="ui-card-muted">
          <p className="text-sm font-semibold text-teal-950">Sincronización con la nube</p>
          <p className="mt-1 text-xs text-slate-600">
            Trae a este dispositivo los <strong>mercados</strong> y <strong>planes de menú</strong> guardados en tu cuenta (se
            fusionan por fecha de actualización).
          </p>
          <button
            type="button"
            disabled={syncNubeCargando}
            className="ui-btn-secondary mt-3 px-4 py-2 text-sm"
            onClick={() =>
              void (async () => {
                if (!user?.id) return;
                setMsgSyncNube(null);
                setSyncNubeCargando(true);
                try {
                  const r = await pullCloudSnapshots(user.id);
                  if (!r.ok) {
                    setMsgSyncNube(r.error ?? "No se pudo sincronizar.");
                  } else {
                    setMsgSyncNube(
                      r.mercados + r.planes === 0
                        ? "Nada nuevo en la nube o ya estaba al día."
                        : `Listo: fusionados ${r.mercados} mercado(s) y ${r.planes} plan(es) desde la nube.`
                    );
                    setTick((t) => t + 1);
                  }
                } finally {
                  setSyncNubeCargando(false);
                }
              })()
            }
          >
            {syncNubeCargando ? "Sincronizando…" : "Traer mercados y planes de la nube"}
          </button>
          {msgSyncNube && (
            <p className="mt-3 rounded-lg border border-teal-200/80 bg-white/90 px-3 py-2 text-xs text-teal-950">
              {msgSyncNube}
            </p>
          )}
        </section>
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
              {snapshotMercado.nombre && (
                <p className="mt-2 font-semibold text-teal-950">{snapshotMercado.nombre}</p>
              )}
              <ul className={`${snapshotMercado.nombre ? "mt-1" : "mt-3"} space-y-1 text-sm text-slate-800`}>
                <li>
                  <span className="text-slate-500">Guardado:</span>{" "}
                  {new Date(snapshotMercado.createdAt).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}
                </li>
                <li>
                  <span className="text-slate-500">Periodo:</span> {snapshotMercado.dias} días · {snapshotMercado.personas}{" "}
                  personas
                </li>
                <li>
                  <span className="text-slate-500">Comprados:</span> {nComprados} ítems
                </li>
                {snapshotMercado.nota && (
                  <li className="text-xs text-amber-800">{snapshotMercado.nota}</li>
                )}
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
          {snapCron ? (
            <>
              {snapCron.titulo && (
                <p className="mt-2 font-semibold text-teal-950">{snapCron.titulo}</p>
              )}
              <ul className="mt-2 space-y-1 text-sm text-slate-800">
                <li>
                  <span className="text-slate-500">Guardado:</span>{" "}
                  {new Date(snapCron.createdAt).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}
                  {" · "}
                  <span className="text-slate-500">
                    hace {Math.max(0, Math.round((Date.now() - new Date(snapCron.createdAt).getTime()) / 86400000))} día(s)
                  </span>
                </li>
                <li>
                  <span className="text-slate-500">Fuente:</span>{" "}
                  {snapCron.fuente === "ia" ? "IA (Gemini)" : "Plantillas"} · {snapCron.dias} días ·{" "}
                  {snapCron.modo === "mixto" ? "mixto" : snapCron.modo === "mercado" ? "mercado" : "perfil"}
                </li>
                {snapActivoCronId === snapCron.id && (
                  <li>
                    <span className="inline-block rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800">
                      ✓ Plan activo de la semana
                    </span>
                  </li>
                )}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-600">Sin menú guardado aún.</p>
          )}
          <Link to="/cronograma" className="ui-btn-violet mt-4 inline-flex">
            {snapCron ? "Abrir / editar cronograma" : "Generar cronograma"}
          </Link>
          <Link
            to={PASO_ASISTENTE.to}
            className="mt-3 block text-xs font-semibold text-violet-900 underline decoration-violet-400/60 hover:decoration-violet-700"
          >
            Asistente (opcional) →
          </Link>
        </section>
      </div>

      <section className="ui-card-muted text-sm text-slate-800">
        <p className="font-semibold text-teal-900">Respaldo en este dispositivo</p>
        <p className="mt-2 text-slate-600">
          Descarga un JSON con las claves <code className="rounded bg-white/80 px-1 text-xs">tec_nutri_salud_*</code>{" "}
          (perfiles, mercado, historial de menús, listas). Las fotos y vídeos del cronograma siguen solo en el
          navegador (IndexedDB).
        </p>
        <p className="mt-1 text-xs text-slate-500">Claves detectadas: {contarClavesRespaldo()}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="ui-btn-secondary px-4 py-2 text-sm"
            onClick={() => descargarRespaldoCompletoJson()}
          >
            Descargar respaldo JSON
          </button>
          <input
            ref={inputRespaldoRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              void (async () => {
                if (
                  !window.confirm(
                    "Se borrarán en este navegador todos los datos NutriSalud guardados localmente (prefijo tec_nutri_salud_) y se sustituirán por el contenido del archivo. Las fotos del cronograma en IndexedDB no se tocan. ¿Continuar?"
                  )
                ) {
                  setEstadoImport("Importación cancelada.");
                  return;
                }
                setEstadoImport("Leyendo archivo…");
                try {
                  const text = await f.text();
                  const r = importarRespaldoReemplazandoTodo(text);
                  if (r.ok) {
                    setEstadoImport(`Listo: se aplicaron ${r.claves} clave(s). Recarga la página si algo no se actualiza.`);
                    setTick((t) => t + 1);
                  } else setEstadoImport(r.error);
                } catch {
                  setEstadoImport("Error al leer el archivo.");
                }
              })();
            }}
          />
          <button
            type="button"
            className="ui-btn-secondary px-4 py-2 text-sm"
            onClick={() => inputRespaldoRef.current?.click()}
          >
            Restaurar desde JSON…
          </button>
        </div>
        {estadoImport && (
          <p className="mt-3 rounded-lg border border-emerald-200/80 bg-white/90 px-3 py-2 text-xs text-slate-800">
            {estadoImport}
          </p>
        )}
      </section>

      {user && isConfigured && supabase && (
        <section className="ui-card-muted">
          <p className="text-sm font-semibold text-teal-950">Seguridad de la cuenta</p>
          {usuarioTieneProveedorEmail(user) ? (
            <>
              <p className="mt-2 text-xs text-slate-600">
                Cambia tu contraseña de acceso con correo y contraseña. Mínimo 6 caracteres.
              </p>
              <div className="mt-3 flex max-w-md flex-col gap-2 sm:flex-row sm:items-end">
                <label className="block flex-1 text-xs">
                  <span className="font-medium text-teal-950">Nueva contraseña</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    value={nuevaClave}
                    onChange={(e) => setNuevaClave(e.target.value)}
                  />
                </label>
                <label className="block flex-1 text-xs">
                  <span className="font-medium text-teal-950">Confirmar</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    value={confirmarClave}
                    onChange={(e) => setConfirmarClave(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  disabled={guardandoClave}
                  className="ui-btn-secondary shrink-0 px-4 py-2 text-xs whitespace-nowrap sm:mb-px"
                  onClick={() => void (async () => {
                    setMsgClave(null);
                    if (nuevaClave.length < 6 || confirmarClave.length < 6) {
                      setMsgClave("Escribe al menos 6 caracteres en ambos campos.");
                      return;
                    }
                    if (nuevaClave !== confirmarClave) {
                      setMsgClave("Las contraseñas no coinciden.");
                      return;
                    }
                    setGuardandoClave(true);
                    try {
                      const { error } = await supabase.auth.updateUser({ password: nuevaClave });
                      if (error) throw error;
                      setMsgClave("Contraseña actualizada.");
                      setNuevaClave("");
                      setConfirmarClave("");
                    } catch (e) {
                      setMsgClave(e instanceof Error ? e.message : "No se pudo actualizar.");
                    } finally {
                      setGuardandoClave(false);
                    }
                  })()}
                >
                  {guardandoClave ? "Guardando…" : "Cambiar contraseña"}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                ¿Olvidaste la actual? Desde{" "}
                <Link to="/login" className="font-semibold text-teal-800 underline">
                  Iniciar sesión
                </Link>{" "}
                usa &quot;¿Olvidaste tu contraseña?&quot;.
              </p>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-600">
              Entraste con <strong>Google</strong>. Para gestionar el acceso usa la configuración de tu cuenta de Google; aquí no hay contraseña de la app.
            </p>
          )}
          {msgClave && (
            <p className="mt-3 rounded-lg border border-teal-200/80 bg-white/90 px-3 py-2 text-xs text-teal-950">
              {msgClave}
            </p>
          )}
        </section>
      )}

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
