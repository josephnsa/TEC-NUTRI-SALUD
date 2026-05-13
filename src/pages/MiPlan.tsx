import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FlujoUsuarioBanner } from "../components/FlujoUsuarioBanner";
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
import { loadPerfilLocal, savePerfilLocal } from "../lib/perfilStorage";
import { fetchProfileRemote, upsertProfileRemote } from "../lib/profileRemote";
import { getMercadoActivoParaPlan, getMercadoRealizado } from "../lib/mercadoHistorial";
import { URL_GOOGLE_AI_STUDIO_API_KEY, agenteRecetasGratisDisponible, generarCronogramaIA } from "../lib/recipesGemini";

const defaultPerfil: PerfilUsuario = {
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

  useEffect(() => {
    const local = loadPerfilLocal();
    if (local) setPerfil(local);
  }, []);

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
    const id = window.setInterval(sync, 2000);
    return () => {
      window.removeEventListener("storage", sync);
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
  }, [diasCronograma, modoCronograma, mercadoActivoId, perfil.estiloDieta]);

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
      setStatus(ok ? "Guardado en la nube y en este dispositivo." : "Guardado solo en el dispositivo (revisa Supabase).");
    } else {
      setStatus("Guardado en este dispositivo. Inicia sesión y configura Supabase para sincronizar.");
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
    setStatus("Sugerencias del cronograma renovadas (misma lógica, otra rotación).");
  };

  const alinearDiasConMercado = () => {
    if (!snapshotMercado) return;
    const d = Math.min(30, Math.max(3, Math.round(snapshotMercado.dias)));
    setDiasCronograma(d);
    setStatus(`Días del cronograma alineados con el mercado (${d} días).`);
  };

  const cargarRecetasIA = async () => {
    if (!agenteRecetasGratisDisponible()) {
      setIaError(
        `Para el agente IA gratuito: crea una clave en Google AI Studio (${URL_GOOGLE_AI_STUDIO_API_KEY}), ponla como VITE_GEMINI_API_KEY y vuelve a ejecutar el build.`
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
      setStatus(
        `Agente IA: ${plan.length} día(s) con recetas orientadas a 1 persona y enlaces de video por plato (Gemini).`
      );
    } catch (e) {
      setIaError(e instanceof Error ? e.message : "Error al generar con IA.");
    } finally {
      setIaCargando(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-leaf-900">Mi plan alimenticio</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tu perfil define estilo y restricciones. El <strong>mercado guardado</strong> alimenta el cronograma cuando
          eliges modo mercado o mixto. Abre la pantalla{" "}
          <Link className="font-semibold text-leaf-800 underline" to="/cronograma">
            Cronograma
          </Link>{" "}
          para ver solo el menú y recetas. Las recomendaciones son educativas; ante patología, consulta a tu equipo de
          salud.
        </p>
        {loadingRemote && <p className="mt-2 text-xs text-slate-500">Cargando perfil desde la nube…</p>}
      </div>

      <FlujoUsuarioBanner variant="compact" />

      <section className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 text-sm text-slate-800">
        <p className="font-semibold text-teal-900">Mercado vinculado al cronograma</p>
        {!mercadoActivoId && (
          <p className="mt-2">
            No hay mercado activo. Ve a{" "}
            <Link className="font-semibold text-teal-800 underline" to="/keto-mercado">
              Mercado keto
            </Link>{" "}
            y pulsa &quot;Guardar mercado realizado&quot;.
          </p>
        )}
        {mercadoActivoId && snapshotMercado && (
          <p className="mt-2">
            Activo: compra del {new Date(snapshotMercado.createdAt).toLocaleString("es")} · {nComprados} productos
            marcados como comprados ·{" "}
            <Link className="font-semibold text-teal-800 underline" to="/keto-mercado">
              Cambiar en Mercado keto
            </Link>
          </p>
        )}
        {modoCronograma !== "perfil" && mercadoActivoId && nComprados === 0 && (
          <p className="mt-2 text-amber-900">
            En este mercado no hay ítems marcados como comprados; el plan usará rotación variada igual que el modo
            perfil hasta que marques lo que tienes en casa.
          </p>
        )}
        {snapshotMercado && (
          <button
            type="button"
            className="mt-3 rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-semibold text-teal-900 hover:bg-teal-50"
            onClick={alinearDiasConMercado}
          >
            Usar misma cantidad de días que el mercado ({snapshotMercado.dias} días)
          </button>
        )}
      </section>

      <div className="grid gap-4 rounded-2xl border border-leaf-100 bg-white p-4 shadow-sm md:grid-cols-2">
        <label className="text-sm md:col-span-1">
          <span className="font-medium">Edad</span>
          <input
            type="number"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            min={12}
            max={100}
            value={perfil.edad}
            onChange={(e) => setPerfil({ ...perfil, edad: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Peso (kg)</span>
          <input
            type="number"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            min={30}
            max={250}
            step={0.1}
            value={perfil.pesoKg}
            onChange={(e) => setPerfil({ ...perfil, pesoKg: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Talla (cm)</span>
          <input
            type="number"
            className="mt-1 w-full rounded-xl border px-3 py-2"
            min={120}
            max={220}
            value={perfil.tallaCm}
            onChange={(e) => setPerfil({ ...perfil, tallaCm: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm">
          <span className="font-medium">Sexo (cálculo energético)</span>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
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
            className="mt-1 w-full rounded-xl border px-3 py-2"
            rows={2}
            value={perfil.enfermedades}
            onChange={(e) => setPerfil({ ...perfil, enfermedades: e.target.value })}
            placeholder="Ej.: diabetes tipo 2, hipertensión…"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="font-medium">Alimentos que no te gustan (separar con coma)</span>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={perfil.alimentosEvitar}
            onChange={(e) => setPerfil({ ...perfil, alimentosEvitar: e.target.value })}
            placeholder="Ej.: pescado, cilantro"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="font-medium">Estilo de plan</span>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={perfil.estiloDieta}
            onChange={(e) => setPerfil({ ...perfil, estiloDieta: e.target.value as PerfilUsuario["estiloDieta"] })}
          >
            <option value="keto">Keto / muy bajo carbohidrato</option>
            <option value="mediterranea">Mediterránea</option>
            <option value="balanceada">Balanceada</option>
          </select>
        </label>

        <fieldset className="md:col-span-2 space-y-2 rounded-xl border border-slate-100 p-3">
          <legend className="px-1 text-sm font-medium text-slate-800">Cronograma según</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="modoCronograma"
              checked={modoCronograma === "perfil"}
              onChange={() => setModoCronograma("perfil")}
            />
            Solo perfil (rotación variada de recetas)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="modoCronograma"
              checked={modoCronograma === "mercado"}
              onChange={() => setModoCronograma("mercado")}
            />
            Mercado activo (prioriza lo que compraste)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="modoCronograma"
              checked={modoCronograma === "mixto"}
              onChange={() => setModoCronograma("mixto")}
            />
            Mixto (recomendado: perfil + ingredientes comprados)
          </label>
        </fieldset>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void guardar()}
            className="rounded-xl bg-leaf-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-leaf-900"
          >
            Guardar perfil
          </button>
          <button
            type="button"
            onClick={nuevasCombinaciones}
            className="rounded-xl border border-leaf-300 bg-white px-4 py-2 text-sm font-semibold text-leaf-900 hover:bg-leaf-50"
          >
            Nuevas combinaciones
          </button>
          <button
            type="button"
            disabled={iaCargando}
            onClick={() => void cargarRecetasIA()}
            className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-violet-900 disabled:opacity-60"
          >
            {iaCargando ? "Generando recetas con agente…" : "Generar recetas con agente IA (gratis)"}
          </button>
          {vistaCronograma === "ia" && cronogramaIa && (
            <button
              type="button"
              onClick={() => {
                setVistaCronograma("plantillas");
                setStatus("Mostrando cronograma local (plantillas).");
              }}
              className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-50"
            >
              Ver recetas locales
            </button>
          )}
          <label className="flex items-center gap-2 text-sm">
            Días de cronograma
            <input
              type="number"
              min={3}
              max={30}
              className="w-20 rounded-lg border px-2 py-1"
              value={diasCronograma}
              onChange={(e) => setDiasCronograma(Number(e.target.value))}
            />
          </label>
        </div>
        {!agenteRecetasGratisDisponible() && (
          <p className="md:col-span-2 rounded-xl border border-violet-100 bg-violet-50/70 p-3 text-xs text-slate-700">
            Las recetas las genera el <strong>mismo agente IA gratuito de Google</strong> (Gemini vía{" "}
            <a
              className="font-semibold text-leaf-800 underline"
              href={URL_GOOGLE_AI_STUDIO_API_KEY}
              target="_blank"
              rel="noreferrer"
            >
              Google AI Studio
            </a>
            , sin tarjeta en el plan gratuito con límites). Crea una clave, configura{" "}
            <code className="rounded bg-white px-1">VITE_GEMINI_API_KEY</code> en <code className="rounded bg-white px-1">.env</code> o en GitHub Actions y vuelve a construir. También sirve para la pantalla{" "}
            <Link className="font-semibold text-leaf-800 underline" to="/agente">
              Asistente
            </Link>
            .
          </p>
        )}
        {iaError && <p className="md:col-span-2 text-sm text-red-700">{iaError}</p>}
        {status && <p className="md:col-span-2 text-sm text-leaf-800">{status}</p>}
      </div>

      <section className="rounded-2xl border border-leaf-100 bg-white p-4 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-leaf-900">Resumen orientativo</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {resumen.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-4" id="cronograma">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold text-leaf-900">Cronograma con recetas y videos</h2>
          <Link
            to="/cronograma"
            className="text-sm font-semibold text-leaf-800 underline hover:text-leaf-950"
          >
            Pantalla solo cronograma →
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          {vistaCronograma === "ia" && cronogramaIa?.length === diasCronograma ? (
            <>
              Recetas del <strong>agente IA</strong> con ingredientes para <strong>1 persona</strong> y enlace de video
              por plato. Orientativo, no clínico.
            </>
          ) : (
            <>
              Plantillas locales (~1 porción). Pulsa &quot;Generar recetas con agente IA (gratis)&quot; para textos más
              largos con cantidades explícitas y video alineado al nombre del plato.
            </>
          )}
        </p>
        <div className="space-y-4">
          {cronogramaMostrado.map((d) => (
            <div key={d.dia} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-leaf-800">Día {d.dia}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {(["desayuno", "almuerzo", "cena"] as const).map((slot) => {
                  const c = d.comidas[slot];
                  const tituloSlot =
                    slot === "desayuno" ? "Desayuno" : slot === "almuerzo" ? "Almuerzo" : "Cena";
                  return (
                    <div key={slot} className="rounded-xl bg-leaf-50/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-leaf-800">{tituloSlot}</p>
                      <p className="mt-1 font-medium text-slate-900">{c.titulo}</p>
                      <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{c.receta}</p>
                      <a
                        className="mt-2 inline-block text-sm font-semibold text-leaf-800 underline"
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
          ))}
        </div>
      </section>
    </div>
  );
}
