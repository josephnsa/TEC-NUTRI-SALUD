import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  contarCompradosMercado,
  generarCronograma,
  resumenNutricional,
  youtubeBusquedaPlato,
  type DiaPlan,
  type ModoCronograma,
  type PerfilUsuario
} from "../lib/nutritionPlan";
import { StepHeader } from "../components/StepHeader";
import { IntField } from "../components/NumericInputs";
import { PERFILES_STORAGE_EVENT, loadPerfilLocal, savePerfilLocal, getActivoPerfilId, loadPerfilMiembroActivo } from "../lib/perfilStorage";
import { etiquetaFechaDiaPlan } from "../lib/planFechas";
import { fetchProfileRemote, upsertProfileRemote } from "../lib/profileRemote";
import { getMercadoActivoParaPlan, getMercadoRealizado } from "../lib/mercadoHistorial";
import { URL_GOOGLE_AI_STUDIO_API_KEY, agenteRecetasGratisDisponible, generarCronogramaIA } from "../lib/recipesGemini";

const defaultPerfil: PerfilUsuario = {
  nombre: "",
  edad: 32,
  pesoKg: 72,
  tallaCm: 168,
  sexo: "f",
  enfermedades: "",
  alimentosEvitar: "",
  estiloDieta: "keto"
};

const CLAVE_VARIEDAD_KEY = "tec_nutri_salud_clave_variedad_v1";

export function Cronograma() {
  const { user, isConfigured } = useAuth();
  const location = useLocation();
  const [perfil, setPerfil] = useState<PerfilUsuario>(defaultPerfil);
  const [diasCronograma, setDiasCronograma] = useState(7);
  const [modoCronograma, setModoCronograma] = useState<ModoCronograma>("mixto");
  const [claveVariedad, setClaveVariedad] = useState(() => {
    try {
      return localStorage.getItem(CLAVE_VARIEDAD_KEY) ?? `inicio-${Date.now()}`;
    } catch {
      return `inicio-${Date.now()}`;
    }
  });
  const [status, setStatus] = useState<string | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [mercadoActivoId, setMercadoActivoId] = useState<string | null>(() => getMercadoActivoParaPlan());
  const [cronogramaIa, setCronogramaIa] = useState<DiaPlan[] | null>(null);
  const [vistaCronograma, setVistaCronograma] = useState<"plantillas" | "ia">("plantillas");
  const [iaCargando, setIaCargando] = useState(false);
  const [iaError, setIaError] = useState<string | null>(null);
  const [perfilContextoId, setPerfilContextoId] = useState<string | null>(null);

  const bootDesdeAlmacenamiento = useCallback(() => {
    const l = loadPerfilLocal();
    if (l) setPerfil(l);
    else setPerfil(defaultPerfil);
    setMercadoActivoId(getMercadoActivoParaPlan());
    setPerfilContextoId(getActivoPerfilId());
  }, []);

  useEffect(() => {
    bootDesdeAlmacenamiento();
    window.addEventListener(PERFILES_STORAGE_EVENT, bootDesdeAlmacenamiento);
    return () => window.removeEventListener(PERFILES_STORAGE_EVENT, bootDesdeAlmacenamiento);
  }, [bootDesdeAlmacenamiento]);

  useEffect(() => {
    if (!user?.id || !isConfigured) return;
    setLoadingRemote(true);
    void (async () => {
      const remote = await fetchProfileRemote(user.id);
      if (remote) {
        setPerfil(remote);
        savePerfilLocal(remote);
      }
      setLoadingRemote(false);
    })();
  }, [user?.id, isConfigured]);

  useEffect(() => {
    const sync = () => setMercadoActivoId(getMercadoActivoParaPlan());
    window.addEventListener("storage", sync);
    window.addEventListener(PERFILES_STORAGE_EVENT, sync);
    const id = window.setInterval(sync, 2000);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PERFILES_STORAGE_EVENT, sync);
      window.clearInterval(id);
    };
  }, []);

  const desdeMercado = Boolean((location.state as { desdeMercado?: boolean } | null)?.desdeMercado);

  useEffect(() => {
    if (!desdeMercado) return;
    const id = getMercadoActivoParaPlan();
    const snap = id ? getMercadoRealizado(id) : null;
    if (snap) {
      const d = Math.min(30, Math.max(3, Math.round(snap.dias)));
      setDiasCronograma(d);
      setModoCronograma("mixto");
    }
    setStatus("Menú alineado con el mercado guardado.");
  }, [desdeMercado, location.key]);

  const snapshotMercado = useMemo(() => {
    if (!mercadoActivoId) return null;
    return getMercadoRealizado(mercadoActivoId);
  }, [mercadoActivoId]);

  useEffect(() => {
    setCronogramaIa(null);
    setVistaCronograma("plantillas");
    setIaError(null);
  }, [diasCronograma, modoCronograma, mercadoActivoId, perfil.estiloDieta, perfilContextoId]);

  const itemsMercadoActivo = snapshotMercado?.items;
  const nComprados = contarCompradosMercado(itemsMercadoActivo);

  const cronograma = useMemo(() => {
    return generarCronograma(perfil, diasCronograma, {
      modo: modoCronograma,
      mercadoItems: itemsMercadoActivo,
      claveVariedad: `${claveVariedad}|${mercadoActivoId ?? "sin-mercado"}`
    });
  }, [perfil, diasCronograma, modoCronograma, itemsMercadoActivo, claveVariedad, mercadoActivoId]);

  const cronogramaMostrado =
    vistaCronograma === "ia" && cronogramaIa?.length === diasCronograma ? cronogramaIa : cronograma;

  const resumen = useMemo(() => resumenNutricional(perfil), [perfil]);

  const guardarPerfilRapido = async () => {
    setStatus(null);
    savePerfilLocal(perfil);
    if (user?.id && isConfigured) {
      const ok = await upsertProfileRemote(user.id, perfil);
      setStatus(ok ? "Perfil guardado." : "Guardado local; revisa Supabase.");
    } else {
      setStatus("Perfil guardado en este dispositivo.");
    }
  };

  const nuevasCombinaciones = () => {
    const next = `var-${Date.now()}`;
    setClaveVariedad(next);
    try {
      localStorage.setItem(CLAVE_VARIEDAD_KEY, next);
    } catch {
      /* ignore */
    }
    setStatus("Sugerencias renovadas (plantillas).");
  };

  const alinearDiasConMercado = () => {
    if (!snapshotMercado) return;
    const d = Math.min(30, Math.max(3, Math.round(snapshotMercado.dias)));
    setDiasCronograma(d);
    setStatus(`Días alineados con el mercado (${d}).`);
  };

  const cargarRecetasIA = async () => {
    if (!agenteRecetasGratisDisponible()) {
      setIaError(`Clave en Google AI Studio (${URL_GOOGLE_AI_STUDIO_API_KEY}) → VITE_GEMINI_API_KEY y rebuild.`);
      return;
    }
    setIaCargando(true);
    setIaError(null);
    setStatus(null);
    try {
      const plan = await generarCronogramaIA(perfil, diasCronograma, itemsMercadoActivo, modoCronograma);
      setCronogramaIa(plan);
      setVistaCronograma("ia");
      setStatus(`IA: ${plan.length} día(s); ~1 porción y video por comida.`);
    } catch (e) {
      setIaError(e instanceof Error ? e.message : "Error IA.");
    } finally {
      setIaCargando(false);
    }
  };

  const fechaIniCron = loadPerfilMiembroActivo()?.fechaInicioPlan ?? null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <StepHeader
            pasoActual={3}
            titulo="Cronograma · tu menú"
            subtitulo={loadingRemote ? "Sincronizando perfil…" : undefined}
          />
        </div>
        <Link
          to="/keto-mercado"
          className="ui-btn-secondary shrink-0 self-start text-center sm:mt-14"
        >
          Volver al mercado
        </Link>
      </div>

      {status && (
        <p className="rounded-xl border border-teal-200/80 bg-teal-50/90 px-3 py-2 text-sm text-teal-900 shadow-sm backdrop-blur-sm">
          {status}
        </p>
      )}

      <section className="ui-card-muted text-sm text-slate-800">
        <p className="font-semibold text-teal-900">Mercado activo</p>
        {!mercadoActivoId && (
          <p className="mt-2">
            Sin mercado guardado.{" "}
            <Link
              className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
              to="/keto-mercado"
            >
              Mercado keto
            </Link>
          </p>
        )}
        {mercadoActivoId && snapshotMercado && (
          <p className="mt-2">
            {new Date(snapshotMercado.createdAt).toLocaleString("es")} · {nComprados} comprados ·{" "}
            <Link
              className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
              to="/keto-mercado"
            >
              Editar lista
            </Link>
          </p>
        )}
        {snapshotMercado && (
          <button
            type="button"
            className="ui-btn-secondary mt-3 px-3 py-1.5 text-xs"
            onClick={alinearDiasConMercado}
          >
            Alinear días con el mercado ({snapshotMercado.dias})
          </button>
        )}
      </section>

      <div className="ui-card">
        <h2 className="font-display text-sm font-semibold text-teal-950">Perfil rápido (estilo de dieta)</h2>
        <p className="mt-1 text-xs text-slate-500">
          Para edad, peso y condiciones usa{" "}
          <Link
            to="/mi-plan"
            className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
          >
            Mi plan
          </Link>
          .
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="font-medium">Estilo</span>
            <select
              className="mt-1 block w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              value={perfil.estiloDieta}
              onChange={(e) => setPerfil({ ...perfil, estiloDieta: e.target.value as PerfilUsuario["estiloDieta"] })}
            >
              <option value="keto">Keto</option>
              <option value="mediterranea">Mediterránea</option>
              <option value="balanceada">Balanceada</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void guardarPerfilRapido()}
            className="ui-btn-primary px-3 py-2"
          >
            Guardar estilo
          </button>
        </div>
      </div>

      <div className="ui-card grid gap-4 md:grid-cols-2">
        <fieldset className="md:col-span-2 space-y-2 rounded-xl border border-emerald-100/80 bg-white/50 p-3 backdrop-blur-sm">
          <legend className="px-1 text-sm font-medium text-teal-900">Cronograma según</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="modoCronogramaPage"
              checked={modoCronograma === "perfil"}
              onChange={() => setModoCronograma("perfil")}
            />
            Solo perfil
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="modoCronogramaPage"
              checked={modoCronograma === "mercado"}
              onChange={() => setModoCronograma("mercado")}
            />
            Mercado activo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="modoCronogramaPage"
              checked={modoCronograma === "mixto"}
              onChange={() => setModoCronograma("mixto")}
            />
            Mixto
          </label>
        </fieldset>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={nuevasCombinaciones}
            className="ui-btn-secondary"
          >
            Nuevas combinaciones
          </button>
          <button
            type="button"
            disabled={iaCargando}
            onClick={() => void cargarRecetasIA()}
            className="ui-btn-violet"
          >
            {iaCargando ? "Agente…" : "Agente IA recetas (gratis)"}
          </button>
          {vistaCronograma === "ia" && cronogramaIa && (
            <button
              type="button"
              onClick={() => {
                setVistaCronograma("plantillas");
                setStatus("Vista plantillas.");
              }}
              className="ui-btn-ghost-violet"
            >
              Ver plantillas
            </button>
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Días</span>
            <IntField
              label="Días del cronograma"
              hideLabel
              value={diasCronograma}
              onCommit={setDiasCronograma}
              min={3}
              max={30}
              inputClassName="w-20 rounded-lg border border-emerald-200/90 bg-white/90 px-2 py-1 text-center text-slate-900 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
            />
          </div>
        </div>
        {!agenteRecetasGratisDisponible() && (
          <p className="md:col-span-2 rounded-xl border border-violet-200/80 bg-violet-50/80 p-3 text-xs text-slate-700 shadow-sm backdrop-blur-sm">
            Gemini: clave en{" "}
            <a
              className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
              href={URL_GOOGLE_AI_STUDIO_API_KEY}
              target="_blank"
              rel="noreferrer"
            >
              Google AI Studio
            </a>{" "}
            → <code className="rounded bg-white px-1">VITE_GEMINI_API_KEY</code> y rebuild. Misma clave en{" "}
            <Link
              className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
              to="/agente"
            >
              Asistente
            </Link>
            .
          </p>
        )}
        {iaError && <p className="md:col-span-2 text-sm text-red-700">{iaError}</p>}
      </div>

      <section className="ui-card">
        <h2 className="ui-section-title">Resumen orientativo</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {resumen.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-4" id="lista-cronograma">
        <h2 className="ui-section-title text-gradient-brand">Días y recetas</h2>
        <p className="text-sm text-slate-600">
          {vistaCronograma === "ia" && cronogramaIa?.length === diasCronograma ? (
            <>
              Vista <strong>IA</strong> (Gemini): ~1 porción y video por plato.
            </>
          ) : (
            <>
              Vista <strong>plantillas</strong> (~1 porción). El enlace abre YouTube con el plato y tu dieta.
            </>
          )}
        </p>
        <div className="space-y-4">
          {cronogramaMostrado.map((d) => {
            const lblFecha = etiquetaFechaDiaPlan(fechaIniCron, d.dia);
            return (
            <div key={d.dia} className="ui-day-block">
              <p className="text-sm font-semibold text-teal-900">
                Día {d.dia}
                {lblFecha && <span className="ml-2 font-normal text-slate-600">· {lblFecha}</span>}
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {(["desayuno", "almuerzo", "cena"] as const).map((slot) => {
                  const c = d.comidas[slot];
                  const tituloSlot =
                    slot === "desayuno" ? "Desayuno" : slot === "almuerzo" ? "Almuerzo" : "Cena";
                  return (
                    <div key={slot} className="ui-meal-slot">
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">{tituloSlot}</p>
                      <p className="mt-1 font-medium text-slate-900">{c.titulo}</p>
                      <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{c.receta}</p>
                      <a
                        className="ui-video-link"
                        href={youtubeBusquedaPlato(c.titulo, c.videoQuery, perfil.estiloDieta)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Buscar video para esta receta
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
