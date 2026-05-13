import { useState } from "react";
import { Link } from "react-router-dom";
import { loadPerfilLocal } from "../lib/perfilStorage";
import { consultarAgenteNutricion } from "../lib/geminiAgent";

export function Agente() {
  const [pregunta, setPregunta] = useState(
    "Dame 3 ideas de meriendas keto sin horno usando lo que suelo tener en casa."
  );
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const enviar = async () => {
    setLoading(true);
    setRespuesta(null);
    try {
      const perfil = loadPerfilLocal() ?? {
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
      setRespuesta(e instanceof Error ? e.message : "No pudimos obtener respuesta. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-leaf-900">Asistente nutricional</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700">
          Haz una pregunta concreta sobre alimentación o menús; tendremos en cuenta tu perfil si lo guardaste en{" "}
          <Link className="font-semibold text-emerald-800 underline hover:no-underline" to="/mi-plan">
            Mis datos
          </Link>
          . Para menús por día usa el{" "}
          <Link className="font-semibold text-emerald-800 underline hover:no-underline" to="/cronograma">
            Cronograma
          </Link>
          .
        </p>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-slate-800">Tu pregunta</span>
        <textarea
          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/20"
          rows={4}
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
        />
      </label>
      <button
        type="button"
        disabled={loading}
        onClick={() => void enviar()}
        className="rounded-xl bg-leaf-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-leaf-900 disabled:opacity-60"
      >
        {loading ? "Pensando…" : "Enviar pregunta"}
      </button>

      {respuesta && (
        <article className="rounded-2xl border border-leaf-100 bg-white p-4 text-sm leading-relaxed text-slate-800 shadow-sm whitespace-pre-wrap">
          {respuesta}
        </article>
      )}

      <p className="text-xs leading-relaxed text-slate-600">
        Orientación general: no sustituye consejo médico ni dietético personalizado. Si tienes condiciones de salud o
        medicación, consulta con un profesional.
      </p>
    </div>
  );
}
