import { Link } from "react-router-dom";
import { MARCA_APP } from "../lib/brand";
import { PASOS_RECORRIDO_PRINCIPAL, PASO_ASISTENTE } from "../lib/recorrido";

const PASOS_UI = [
  ...PASOS_RECORRIDO_PRINCIPAL.map((p) => ({
    n: p.paso,
    titulo: p.tituloPagina,
    desc: p.descripcionBanner,
    to: p.to
  })),
  {
    n: PASO_ASISTENTE.n,
    titulo: PASO_ASISTENTE.titulo,
    desc: PASO_ASISTENTE.descripcionBanner,
    to: PASO_ASISTENTE.to
  }
] as const;

type Props = { className?: string; variant?: "default" | "compact" };

export function FlujoUsuarioBanner({ className = "", variant = "default" }: Props) {
  if (variant === "compact") {
    return (
      <aside
        className={`rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-sm text-slate-800 ${className}`}
        aria-label="Recorrido sugerido en la app"
      >
        <p className="font-semibold text-teal-900">Orden recomendado</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 marker:text-teal-800">
          {PASOS_UI.map((p) => (
            <li key={p.n}>
              <Link to={p.to} className="font-semibold text-teal-900 underline hover:no-underline">
                {p.titulo}
              </Link>
              : {p.desc}
            </li>
          ))}
        </ol>
        <p className="mt-3 border-t border-teal-200/80 pt-2 text-xs text-slate-600">
          Porciones del cronograma: orientativas para <strong>1 persona</strong> (multiplica si cocinas para más).
        </p>
      </aside>
    );
  }

  return (
    <section
      className={`rounded-2xl border border-leaf-200 bg-white p-5 shadow-sm ${className}`}
      aria-label={`Cómo usar ${MARCA_APP}`}
    >
      <h2 className="font-display text-lg font-semibold text-leaf-900">Tu recorrido sugerido</h2>
      <p className="mt-1 text-sm text-slate-600">
        Tres pasos para el menú; el asistente es opcional para dudas puntuales.
      </p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PASOS_UI.map((p) => (
          <li
            key={p.n}
            className={`flex gap-3 rounded-xl border p-3 text-sm text-slate-800 ${
              p.n <= 3 ? "border-emerald-200 bg-emerald-50/50" : "border-leaf-100 bg-leaf-50/40"
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
              {p.n}
            </span>
            <div>
              <Link to={p.to} className="font-semibold text-leaf-900 underline hover:no-underline">
                {p.titulo}
              </Link>
              <p className="mt-1 text-xs text-slate-600">{p.desc}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
        Seguiremos puliendo textos y funciones según feedback.
      </p>
    </section>
  );
}
