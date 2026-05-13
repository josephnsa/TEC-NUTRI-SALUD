import { useState } from "react";
import { Link } from "react-router-dom";
import { loadPerfilLocal } from "../lib/perfilStorage";
import { consultarAgenteNutricion } from "../lib/geminiAgent";

export function Agente() {
  const [pregunta, setPregunta] = useState(
    "3 meriendas keto sin horno con ingredientes básicos de despensa."
  );
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    } catch (e) {
      setRespuesta(e instanceof Error ? e.message : "Sin respuesta. Reintenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const linkClass =
    "font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700";

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">Asistente</p>
        <h1 className="font-display text-2xl font-bold text-teal-950 sm:text-3xl">Asistente nutricional</h1>
        <p className="max-w-2xl text-sm text-slate-700">
          Pregunta concreta; usamos tu perfil si lo guardaste en{" "}
          <Link className={linkClass} to="/mi-plan">
            Mis datos
          </Link>
          . Menús por día:{" "}
          <Link className={linkClass} to="/cronograma">
            Cronograma
          </Link>
          .
        </p>
      </header>

      <div className="ui-card space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-teal-950">Tu pregunta</span>
          <textarea
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            rows={4}
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={() => void enviar()}
          className="ui-btn-primary"
        >
          {loading ? "Pensando…" : "Enviar pregunta"}
        </button>
      </div>

      {respuesta && (
        <article className="ui-card whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{respuesta}</article>
      )}

      <p className="text-xs text-slate-600">
        Orientación general; no sustituye consejo médico ni dietético profesional.
      </p>
    </div>
  );
}
