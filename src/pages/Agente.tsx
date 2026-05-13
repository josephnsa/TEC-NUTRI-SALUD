import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { loadPerfilLocal } from "../lib/perfilStorage";
import { consultarAgenteNutricion, geminiDisponible } from "../lib/geminiAgent";
import { URL_GOOGLE_AI_STUDIO_API_KEY } from "../lib/googleAiStudio";

export function Agente() {
  const { user } = useAuth();
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
      setRespuesta(e instanceof Error ? e.message : "Error al consultar el modelo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-leaf-900">Asistente nutricional (IA)</h1>
        <p className="mt-1 text-sm text-slate-600">
          Opción gratuita en modo desarrollo:{" "}
          <a
            className="font-semibold text-leaf-800 underline"
            href={URL_GOOGLE_AI_STUDIO_API_KEY}
            target="_blank"
            rel="noreferrer"
          >
            Google AI Studio
          </a>{" "}
          → crea clave → colócala como <code className="rounded bg-slate-100 px-1">VITE_GEMINI_API_KEY</code> al
          construir. Sin clave, verás un mensaje de modo local.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Paso opcional (después de datos → mercado → menú). La misma clave Gemini sirve para{" "}
          <a className="font-semibold text-leaf-800 underline" href="#/cronograma">
            recetas del cronograma
          </a>
          .
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Estado API: {geminiDisponible() ? "clave detectada en build" : "sin clave (solo texto fijo)"}.{" "}
          {user ? `Sesión: ${user.email ?? user.id}` : "Puedes usar el asistente sin cuenta."}
        </p>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-slate-800">Tu pregunta</span>
        <textarea
          className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
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
        {loading ? "Pensando…" : "Preguntar al asistente"}
      </button>

      {respuesta && (
        <article className="rounded-2xl border border-leaf-100 bg-white p-4 text-sm leading-relaxed text-slate-800 shadow-sm whitespace-pre-wrap">
          {respuesta}
        </article>
      )}

      <p className="text-xs text-slate-500">
        No sustituye consejo médico. Si tomas medicamentos o tienes condiciones crónicas, valida cambios con
        profesional.
      </p>
    </div>
  );
}
