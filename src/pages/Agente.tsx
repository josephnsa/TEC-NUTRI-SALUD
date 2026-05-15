import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getActivoPerfilId, loadPerfilLocal } from "../lib/perfilStorage";
import { consultarAgenteNutricion, geminiDisponible, type ContextoAgente } from "../lib/geminiAgent";
import { MarkdownRender } from "../components/MarkdownRender";
import { URL_GOOGLE_AI_STUDIO_API_KEY } from "../lib/googleAiStudio";
import { getMercadoActivoParaPlan, getMercadoRealizado } from "../lib/mercadoHistorial";
import { getSnapshotActivoId, listarSnapshots } from "../lib/cronogramaHistorial";
import type { PerfilUsuario } from "../lib/nutritionPlan";

const SUGERENCIAS_BASE: Record<string, string[]> = {
  keto: [
    "¿Cuántos gramos de carbohidratos puedo comer en dieta keto?",
    "Tres meriendas keto rápidas sin hornear.",
    "¿Cómo salgo de un estancamiento en dieta keto?",
    "¿Es normal el mareo y fatiga en la primera semana keto?"
  ],
  mediterranea: [
    "¿Cuánto aceite de oliva es razonable al día en dieta mediterránea?",
    "Propón tres días de menú mediterráneo equilibrado.",
    "¿Qué frutos secos y en qué cantidad son ideales en esta dieta?",
    "Receta mediterránea rápida de menos de 30 minutos."
  ],
  balanceada: [
    "¿Cuántas veces a la semana debo comer legumbres?",
    "¿Cómo distribuyo los macros en una dieta balanceada?",
    "Propón una semana de menú balanceado variado.",
    "¿Qué snacks saludables me ayudan a no picar entre horas?"
  ]
};

const SUGERENCIAS_GENERALES = [
  "¿Cómo distribuyo las proteínas a lo largo del día?",
  "Ideas de cenas ligeras sin pasar hambre.",
  "¿Qué alimentos ayudan a mejorar el sueño desde la dieta?",
  "¿Cuáles son los mejores alimentos antiinflamatorios?"
];

function generarSugerencias(perfil: PerfilUsuario | null): string[] {
  if (!perfil) return SUGERENCIAS_GENERALES;
  const base = [...(SUGERENCIAS_BASE[perfil.estiloDieta] ?? SUGERENCIAS_GENERALES)];
  const objetivo = perfil.objetivosNutricion?.pesoObjetivoKg;
  if (objetivo != null && Math.abs(perfil.pesoKg - objetivo) >= 0.5) {
    const pierde = perfil.pesoKg > objetivo;
    base.push(
      pierde
        ? `Estrategias para bajar ${(perfil.pesoKg - objetivo).toFixed(1)} kg de forma saludable con dieta ${perfil.estiloDieta}.`
        : `¿Cómo gano ${(objetivo - perfil.pesoKg).toFixed(1)} kg de masa muscular con dieta ${perfil.estiloDieta}?`
    );
  }
  if (perfil.enfermedades?.trim()) {
    base.push(`¿Cómo adapto la dieta ${perfil.estiloDieta} considerando: ${perfil.enfermedades.trim().slice(0, 60)}?`);
  }
  if (perfil.alimentosEvitar?.trim()) {
    base.push(`Sustitutos saludables para ${perfil.alimentosEvitar.trim().slice(0, 40)} en dieta ${perfil.estiloDieta}.`);
  }
  return base.slice(0, 6);
}

const HISTORIAL_KEY = "tec_nutri_salud_agente_historial_v1";
const MAX_HISTORIAL = 8;

function leerHistorial(): string[] {
  try {
    const raw = localStorage.getItem(HISTORIAL_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? (arr as string[]).filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function guardarEnHistorial(pregunta: string): string[] {
  const trimmed = pregunta.trim();
  if (!trimmed) return leerHistorial();
  const prev = leerHistorial().filter((s) => s !== trimmed);
  const next = [trimmed, ...prev].slice(0, MAX_HISTORIAL);
  try {
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(next));
  } catch {
    /* storage lleno */
  }
  return next;
}

export function Agente() {
  const perfilCargado = useMemo(() => loadPerfilLocal(), []);
  const sugerencias = useMemo(() => generarSugerencias(perfilCargado), [perfilCargado]);

  const [pregunta, setPregunta] = useState(() => sugerencias[0] ?? SUGERENCIAS_GENERALES[0]!);
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState<string[]>(() => leerHistorial());
  const respuestaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistorial(leerHistorial());
  }, []);

  const enviar = async () => {
    setLoading(true);
    setRespuesta(null);
    try {
      const perfil = loadPerfilLocal() ?? {
        nombre: "",
        edad: 30,
        pesoKg: 70,
        tallaCm: 165,
        sexo: "o" as const,
        enfermedades: "",
        alimentosEvitar: "",
        estiloDieta: "keto" as const
      };

      // Cargar contexto del mercado y plan activos
      const contexto: ContextoAgente = {};
      const mercadoId = getMercadoActivoParaPlan();
      if (mercadoId) {
        const snap = getMercadoRealizado(mercadoId);
        if (snap?.items?.length) contexto.mercadoItems = snap.items;
      }
      const perfilId = getActivoPerfilId();
      const snapId = getSnapshotActivoId(perfilId);
      if (snapId && perfilId) {
        contexto.snapActivo = listarSnapshots(perfilId).find((s) => s.id === snapId) ?? null;
      }

      const text = await consultarAgenteNutricion(perfil, pregunta, contexto);
      setRespuesta(text);
      const next = guardarEnHistorial(pregunta);
      setHistorial(next);
      setTimeout(() => {
        respuestaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } catch (e) {
      setRespuesta(e instanceof Error ? e.message : "Sin respuesta. Reintenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const limpiarHistorial = () => {
    try {
      localStorage.removeItem(HISTORIAL_KEY);
    } catch {
      /* ignore */
    }
    setHistorial([]);
  };

  const linkClass = "font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700";
  const tieneApiKey = geminiDisponible();

  // Detectar contexto disponible para mostrar al usuario
  const mercadoId = getMercadoActivoParaPlan();
  const tieneMercado = Boolean(mercadoId && getMercadoRealizado(mercadoId)?.items?.length);
  const perfilId = getActivoPerfilId();
  const snapId = getSnapshotActivoId(perfilId);
  const tieneSnap = Boolean(snapId && perfilId && listarSnapshots(perfilId).some((s) => s.id === snapId));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-800">Asistente</p>
        <h1 className="font-display text-2xl font-bold text-teal-950 sm:text-3xl">Asistente nutricional</h1>
        <p className="max-w-2xl text-sm text-slate-700">
          Consultas puntuales de nutrición usando tu perfil de{" "}
          <Link className={linkClass} to="/mi-plan">
            Mis datos
          </Link>
          . Para menús diarios completos usa{" "}
          <Link className={linkClass} to="/cronograma">
            Cronograma
          </Link>
          .
        </p>
      </header>

      {(tieneMercado || tieneSnap) && (
        <div className="flex flex-wrap gap-2">
          {tieneMercado && (
            <span className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800">
              ✓ Mercado activo incluido en contexto
            </span>
          )}
          {tieneSnap && (
            <span className="rounded-full border border-teal-200/80 bg-teal-50/80 px-3 py-1 text-xs font-semibold text-teal-800">
              ✓ Plan activo incluido en contexto
            </span>
          )}
        </div>
      )}

      {!tieneApiKey && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm backdrop-blur-sm">
          <p className="font-semibold">Sin clave API configurada</p>
          <p className="mt-1 text-xs">
            Crea una clave gratuita en{" "}
            <a href={URL_GOOGLE_AI_STUDIO_API_KEY} target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-amber-600/50 hover:decoration-amber-800">
              Google AI Studio
            </a>{" "}
            → añade <code className="rounded bg-white px-1">VITE_GEMINI_API_KEY</code> al entorno y reconstruye. Puedes explorar las preguntas sugeridas igualmente.
          </p>
        </div>
      )}

      <div className="ui-card space-y-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Sugerencias rápidas</p>
            {perfilCargado && (
              <span className="rounded-full border border-teal-200/80 bg-teal-50/80 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                para dieta {perfilCargado.estiloDieta}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {sugerencias.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPregunta(s)}
                className={`rounded-xl border px-3 py-1.5 text-left text-xs transition ${
                  pregunta === s
                    ? "border-teal-400/80 bg-teal-100/90 font-semibold text-teal-900 shadow-sm"
                    : "border-emerald-200/80 bg-white/90 text-slate-700 hover:border-teal-300 hover:bg-teal-50/70"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-teal-950">Tu pregunta</span>
          <textarea
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            rows={3}
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void enviar();
            }}
            placeholder="Escribe una pregunta o elige una sugerencia arriba…"
          />
          <p className="mt-1 text-[10px] text-slate-400">Ctrl+Enter para enviar</p>
        </label>

        <button
          type="button"
          disabled={loading || !pregunta.trim()}
          onClick={() => void enviar()}
          className="ui-btn-primary"
        >
          {loading ? "Pensando…" : "Enviar pregunta"}
        </button>
      </div>

      {historial.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Preguntas recientes
            </p>
            <button
              type="button"
              onClick={limpiarHistorial}
              className="text-[10px] font-medium text-slate-400 hover:text-red-500 transition"
            >
              Limpiar
            </button>
          </div>
          <ul className="mt-2 space-y-1.5">
            {historial.map((h) => (
              <li key={h}>
                <button
                  type="button"
                  onClick={() => setPregunta(h)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition ${
                    pregunta === h
                      ? "border-teal-300/80 bg-teal-50 font-semibold text-teal-900"
                      : "border-slate-100 bg-slate-50/80 text-slate-700 hover:border-teal-200 hover:bg-white"
                  }`}
                >
                  {h}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-teal-200/80 bg-teal-50/60 px-4 py-4 text-sm text-teal-800">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          Consultando al asistente…
        </div>
      )}

      {respuesta && !loading && (
        <article
          ref={respuestaRef}
          className="motion-safe:animate-fade-up rounded-2xl border border-emerald-200/80 bg-white/95 p-5 shadow-md shadow-teal-900/5 backdrop-blur-sm"
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-teal-800">Respuesta</p>
          <MarkdownRender texto={respuesta} />
        </article>
      )}

      <p className="text-xs text-slate-500">
        Orientación general de bienestar; no sustituye consejo médico ni dietético profesional.
      </p>
    </div>
  );
}
