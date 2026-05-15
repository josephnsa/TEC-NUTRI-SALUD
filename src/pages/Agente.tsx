import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { loadPerfilLocal } from "../lib/perfilStorage";
import { consultarAgenteNutricion, geminiDisponible } from "../lib/geminiAgent";
import { MarkdownRender } from "../components/MarkdownRender";
import { URL_GOOGLE_AI_STUDIO_API_KEY } from "../lib/googleAiStudio";

const SUGERENCIAS = [
  "3 meriendas keto sin horno con ingredientes básicos de despensa.",
  "¿Qué desayunos rápidos encajan en dieta mediterránea?",
  "Crea una lista de compras keto para 5 días y 2 personas.",
  "¿Cómo distribuyo las proteínas a lo largo del día?",
  "Ideas de cenas ligeras para bajar carbohidratos sin pasar hambre.",
  "¿Qué alimentos ayudan a mejorar el sueño desde la dieta?",
];

export function Agente() {
  const [pregunta, setPregunta] = useState(SUGERENCIAS[0]!);
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const respuestaRef = useRef<HTMLDivElement>(null);

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
      const text = await consultarAgenteNutricion(perfil, pregunta);
      setRespuesta(text);
      setTimeout(() => {
        respuestaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } catch (e) {
      setRespuesta(e instanceof Error ? e.message : "Sin respuesta. Reintenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const linkClass = "font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700";
  const tieneApiKey = geminiDisponible();

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
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-800">Sugerencias rápidas</p>
          <div className="flex flex-wrap gap-2">
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
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
