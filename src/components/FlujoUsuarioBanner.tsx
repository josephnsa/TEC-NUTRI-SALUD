import { Link } from "react-router-dom";

const PASOS = [
  {
    n: 1,
    titulo: "Mercado keto",
    desc: "Días y comensales, lista sugerida, marca lo comprado y Guardar mercado realizado.",
    to: "/keto-mercado"
  },
  {
    n: 2,
    titulo: "Mi plan",
    desc: "Perfil (datos y gustos). Define cómo quieres que el sistema interprete tu dieta.",
    to: "/mi-plan"
  },
  {
    n: 3,
    titulo: "Cronograma",
    desc: "Menú por días: plantillas o Agente IA. Recetas con cantidades para 1 persona; video enlazado a ese plato.",
    to: "/cronograma"
  },
  {
    n: 4,
    titulo: "Asistente",
    desc: "Misma IA Gemini para preguntas puntuales (orientativo, no clínico).",
    to: "/agente"
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
        <p className="font-semibold text-teal-900">Camino recomendado</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 marker:text-teal-800">
          {PASOS.map((p) => (
            <li key={p.n}>
              <Link to={p.to} className="font-semibold text-teal-900 underline hover:no-underline">
                {p.titulo}
              </Link>
              : {p.desc}
            </li>
          ))}
        </ol>
        <p className="mt-3 border-t border-teal-200/80 pt-2 text-xs text-slate-600">
          Porciones en cronograma: cantidades orientativas para <strong>1 persona</strong>; si cocinas para más
          comensales, multiplica proporcionalmente.
        </p>
      </aside>
    );
  }

  return (
    <section
      className={`rounded-2xl border border-leaf-200 bg-white p-5 shadow-sm ${className}`}
      aria-label="Cómo usar TEC Nutri Salud"
    >
      <h2 className="font-display text-lg font-semibold text-leaf-900">Tu recorrido en la app</h2>
      <p className="mt-1 text-sm text-slate-600">
        Un solo flujo: mercado real → perfil → menú con recetas y buscar video por cada plato.
      </p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PASOS.map((p) => (
          <li
            key={p.n}
            className="flex gap-3 rounded-xl border border-leaf-100 bg-leaf-50/60 p-3 text-sm text-slate-800"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-leaf-700 text-xs font-bold text-white">
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
        Las recetas del cronograma (plantillas o agente IA) indican cantidades para{" "}
        <strong>una porción</strong>. El enlace de cada comida abre YouTube con una búsqueda alineada al nombre del plato
        y al estilo de dieta.
      </p>
    </section>
  );
}
