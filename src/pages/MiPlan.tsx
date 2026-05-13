import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StepHeader } from "../components/StepHeader";
import { DecimalField, IntField } from "../components/NumericInputs";
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
import {
  PERFILES_STORAGE_EVENT,
  MAX_PERFILES,
  addPerfilMiembro,
  getActivoPerfilId,
  listPerfilesMiembros,
  loadPerfilLocal,
  loadPerfilMiembroActivo,
  perfilGuardadoEnDispositivo,
  removePerfilMiembro,
  saveFechaInicioPlanActivo,
  savePerfilLocal,
  setActivoPerfilId,
  stripToUsuario
} from "../lib/perfilStorage";
import { fetchProfileRemote, upsertProfileRemote } from "../lib/profileRemote";
import { getMercadoActivoParaPlan, getMercadoRealizado, purgeMercadoDePerfil } from "../lib/mercadoHistorial";
import { URL_GOOGLE_AI_STUDIO_API_KEY, agenteRecetasGratisDisponible, generarCronogramaIA } from "../lib/recipesGemini";
import { RUTA_MI_ESPACIO } from "../lib/recorrido";
import { etiquetaFechaDiaPlan } from "../lib/planFechas";

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

export function MiPlan() {
  const { user, isConfigured } = useAuth();
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
  const [fechaInicioPlan, setFechaInicioPlan] = useState<string>("");
  const [perfilContextoId, setPerfilContextoId] = useState<string | null>(null);

  const bootDesdeAlmacenamiento = useCallback(() => {
    const l = loadPerfilLocal();
    if (l) setPerfil(l);
    else setPerfil(defaultPerfil);
    const m = loadPerfilMiembroActivo();
    setFechaInicioPlan(m?.fechaInicioPlan ?? "");
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
        const m = loadPerfilMiembroActivo();
        setFechaInicioPlan(m?.fechaInicioPlan ?? "");
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

  const guardar = async () => {
    setStatus(null);
    savePerfilLocal(perfil);
    if (user?.id && isConfigured) {
      const ok = await upsertProfileRemote(user.id, perfil);
      setStatus(ok ? "Guardado en la nube y en el dispositivo." : "Solo en el dispositivo; revisa Supabase.");
    } else {
      setStatus("Guardado en el dispositivo. Inicia sesión para sincronizar.");
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
    setStatus("Sugerencias renovadas.");
  };

  const alinearDiasConMercado = () => {
    if (!snapshotMercado) return;
    const d = Math.min(30, Math.max(3, Math.round(snapshotMercado.dias)));
    setDiasCronograma(d);
    setStatus(`Días alineados con el mercado (${d}).`);
  };

  const cargarRecetasIA = async () => {
    if (!agenteRecetasGratisDisponible()) {
      setIaError(
        `Clave en Google AI Studio (${URL_GOOGLE_AI_STUDIO_API_KEY}) → variable VITE_GEMINI_API_KEY y rebuild.`
      );
      return;
    }
    setIaCargando(true);
    setIaError(null);
    setStatus(null);
    try {
      const plan = await generarCronogramaIA(perfil, diasCronograma, itemsMercadoActivo, modoCronograma);
      setCronogramaIa(plan);
      setVistaCronograma("ia");
      setStatus(`IA: ${plan.length} día(s); ~1 porción y video por plato.`);
    } catch (e) {
      setIaError(e instanceof Error ? e.message : "Error al generar con IA.");
    } finally {
      setIaCargando(false);
    }
  };

  const miembros = listPerfilesMiembros();
  const activoId = getActivoPerfilId() ?? miembros[0]?.id ?? "";

  const onCambiarPerfilLista = (id: string) => {
    if (setActivoPerfilId(id)) bootDesdeAlmacenamiento();
  };

  const onAnadirPersona = () => {
    if (!perfilGuardadoEnDispositivo()) {
      setStatus("Guarda una vez con «Guardar perfil» antes de añadir otra persona.");
      return;
    }
    const m = addPerfilMiembro();
    if (!m) setStatus(`Máximo ${MAX_PERFILES} perfiles.`);
    else {
      setPerfil(stripToUsuario(m));
      setFechaInicioPlan(m.fechaInicioPlan ?? "");
      setMercadoActivoId(getMercadoActivoParaPlan());
      setPerfilContextoId(m.id);
      setStatus("Nuevo perfil activo. Completa sus datos y mercado.");
    }
  };

  const onEliminarPersonaActiva = () => {
    if (miembros.length <= 1) return;
    if (!window.confirm("¿Eliminar el perfil activo? Se borran sus mercados guardados para ese perfil.")) return;
    const id = activoId;
    if (removePerfilMiembro(id)) {
      purgeMercadoDePerfil(id);
      bootDesdeAlmacenamiento();
      setStatus("Perfil eliminado.");
    }
  };

  const onFechaInicioChange = (v: string) => {
    setFechaInicioPlan(v);
    saveFechaInicioPlanActivo(v || null);
  };

  return (
    <div className="space-y-8">
      <StepHeader
        pasoActual={1}
        titulo="Mi plan alimenticio"
        subtitulo={loadingRemote ? "Sincronizando perfil…" : undefined}
      />

      {miembros.length > 0 && (
        <section className="ui-card space-y-3" aria-labelledby="familia-heading">
          <h2 id="familia-heading" className="ui-section-title">
            Familia (este dispositivo)
          </h2>
          <p className="text-xs text-slate-600">
            Cada persona tiene su mercado y lista keto. Usa el selector de la barra superior o este menú para cambiar de perfil.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="font-medium text-teal-950">Perfil a editar</span>
              <select
                className="mt-1 block min-w-[12rem] rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                value={activoId}
                onChange={(e) => onCambiarPerfilLista(e.target.value)}
              >
                {miembros.map((m, i) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre.trim() || `Persona ${i + 1}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="font-medium text-teal-950">Inicio del plan (opcional)</span>
              <input
                type="date"
                className="mt-1 block rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                value={fechaInicioPlan}
                onChange={(e) => onFechaInicioChange(e.target.value)}
              />
            </label>
            <button type="button" className="ui-btn-secondary" onClick={onAnadirPersona}>
              Añadir persona
            </button>
            {miembros.length > 1 && (
              <button type="button" className="ui-btn-secondary text-red-800 hover:border-red-200" onClick={onEliminarPersonaActiva}>
                Quitar perfil activo
              </button>
            )}
          </div>
        </section>
      )}

      <div className="ui-card-muted flex flex-col gap-2 px-4 py-3 text-sm text-slate-800 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <span className="font-semibold text-teal-900">Mercado para el plan</span>
          {!mercadoActivoId ? (
            <span className="mt-0.5 block text-teal-800 sm:mt-0 sm:inline sm:ml-2">
              Sin activo ·{" "}
              <Link className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700" to="/keto-mercado">
                paso 2 · Mercado
              </Link>
            </span>
          ) : (
            <span className="mt-0.5 block text-teal-800 sm:mt-0 sm:inline sm:ml-2">
              {nComprados} comprados ·{" "}
              <Link className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700" to="/keto-mercado">
                editar
              </Link>
              {" · "}
              <Link className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700" to={RUTA_MI_ESPACIO}>
                ver resumen
              </Link>
            </span>
          )}
        </div>
        {snapshotMercado && (
          <button
            type="button"
            className="ui-btn-secondary shrink-0 px-3 py-1.5 text-xs"
            onClick={alinearDiasConMercado}
          >
            Alinear {snapshotMercado.dias} días con el mercado
          </button>
        )}
      </div>
      {modoCronograma !== "perfil" && mercadoActivoId && nComprados === 0 && (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 shadow-sm backdrop-blur-sm">
          Modo mercado/mixto sin comprados: el menú rota como solo perfil. Marca en{" "}
          <Link className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700" to="/keto-mercado">
            Mercado keto
          </Link>
          .
        </p>
      )}

      <div className="ui-card grid gap-4 md:grid-cols-2">
        <label className="text-sm md:col-span-2">
          <span className="font-medium">Nombre o apodo</span>
          <input
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 text-slate-900 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
            value={perfil.nombre}
            onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value.slice(0, 80) })}
            placeholder="Ej.: Ana, Luis, Mamá…"
            maxLength={80}
            autoComplete="name"
          />
        </label>
        <IntField
          label="Edad"
          value={perfil.edad}
          onCommit={(edad) => setPerfil({ ...perfil, edad })}
          min={12}
          max={100}
        />
        <DecimalField
          label="Peso (kg)"
          value={perfil.pesoKg}
          onCommit={(pesoKg) => setPerfil({ ...perfil, pesoKg })}
          min={30}
          max={250}
          fractionDigits={1}
        />
        <IntField
          label="Talla (cm)"
          value={perfil.tallaCm}
          onCommit={(tallaCm) => setPerfil({ ...perfil, tallaCm })}
          min={120}
          max={220}
        />
        <label className="text-sm">
          <span className="font-medium">Sexo (cálculo energético)</span>
          <select
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            value={perfil.sexo}
            onChange={(e) => setPerfil({ ...perfil, sexo: e.target.value as PerfilUsuario["sexo"] })}
          >
            <option value="f">Femenino</option>
            <option value="m">Masculino</option>
            <option value="o">Otro / prefiero no decir</option>
          </select>
        </label>
        <label className="text-sm md:col-span-2">
          <span className="font-medium">Enfermedades o condiciones (texto libre)</span>
          <textarea
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            rows={2}
            value={perfil.enfermedades}
            onChange={(e) => setPerfil({ ...perfil, enfermedades: e.target.value })}
            placeholder="Ej.: diabetes tipo 2, hipertensión…"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="font-medium">Alimentos que no te gustan (separar con coma)</span>
          <input
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            value={perfil.alimentosEvitar}
            onChange={(e) => setPerfil({ ...perfil, alimentosEvitar: e.target.value })}
            placeholder="Ej.: pescado, cilantro"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="font-medium">Estilo de plan</span>
          <select
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            value={perfil.estiloDieta}
            onChange={(e) => setPerfil({ ...perfil, estiloDieta: e.target.value as PerfilUsuario["estiloDieta"] })}
          >
            <option value="keto">Keto / muy bajo carbohidrato</option>
            <option value="mediterranea">Mediterránea</option>
            <option value="balanceada">Balanceada</option>
          </select>
        </label>

        <fieldset className="md:col-span-2 space-y-2 rounded-xl border border-emerald-100/80 bg-white/50 p-3 backdrop-blur-sm">
          <legend className="px-1 text-sm font-medium text-teal-900">Cronograma según</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="modoCronograma"
              checked={modoCronograma === "perfil"}
              onChange={() => setModoCronograma("perfil")}
            />
            Solo perfil
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="modoCronograma"
              checked={modoCronograma === "mercado"}
              onChange={() => setModoCronograma("mercado")}
            />
            Mercado activo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="modoCronograma"
              checked={modoCronograma === "mixto"}
              onChange={() => setModoCronograma("mixto")}
            />
            Mixto
          </label>
        </fieldset>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void guardar()}
            className="ui-btn-primary"
          >
            Guardar perfil
          </button>
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
            {iaCargando ? "Generando…" : "Recetas con IA (gratis)"}
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
              Ver recetas locales
            </button>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="shrink-0">Días de cronograma</span>
            <IntField
              label="Días de cronograma"
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
            Recetas con Gemini: clave en{" "}
            <a
              className="font-semibold text-teal-800 underline decoration-teal-400/70 hover:text-teal-950"
              href={URL_GOOGLE_AI_STUDIO_API_KEY}
              target="_blank"
              rel="noreferrer"
            >
              Google AI Studio
            </a>{" "}
            → <code className="rounded bg-white px-1">VITE_GEMINI_API_KEY</code> y rebuild. Misma clave en{" "}
            <Link className="font-semibold text-teal-800 underline decoration-teal-400/70 hover:text-teal-950" to="/agente">
              Asistente
            </Link>
            .
          </p>
        )}
        {iaError && <p className="md:col-span-2 text-sm text-red-700">{iaError}</p>}
        {status && <p className="md:col-span-2 text-sm font-medium text-teal-900">{status}</p>}
      </div>

      <section className="ui-card">
        <h2 className="ui-section-title">Resumen orientativo</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {resumen.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-4" id="cronograma">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="ui-section-title text-gradient-brand">Cronograma con recetas y videos</h2>
          <Link
            to="/cronograma"
            className="ui-btn-secondary shrink-0 text-center text-sm"
          >
            Pantalla solo cronograma
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          {vistaCronograma === "ia" && cronogramaIa?.length === diasCronograma ? (
            <>
              Vista <strong>IA</strong>: ~1 porción y video por plato. Orientativo.
            </>
          ) : (
            <>
              Vista <strong>plantillas</strong> (~1 porción). Usa &quot;Recetas con IA&quot; para cantidades detalladas.
            </>
          )}
        </p>
        <div className="space-y-4">
          {cronogramaMostrado.map((d) => {
            const lblFecha = etiquetaFechaDiaPlan(fechaInicioPlan || null, d.dia);
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
