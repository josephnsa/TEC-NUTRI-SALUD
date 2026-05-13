import { Link } from "react-router-dom";
import { FlujoUsuarioBanner } from "../components/FlujoUsuarioBanner";
import { PASOS_RECORRIDO_PRINCIPAL } from "../lib/recorrido";

export function Home() {
  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-leaf-800 via-teal-900 to-emerald-950 p-6 text-white shadow-xl sm:p-10 md:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/90 sm:text-sm">
          Flujo en 3 pasos · PWA lista para móvil
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl md:text-[2.35rem]">
          Datos → Mercado → Menú
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-emerald-50/95 sm:text-base">
          Primero cuéntanos tu perfil, luego arma tu lista de compras y al final obtén el cronograma con recetas y video.
          Sin vueltas: el menú superior y el de abajo repiten el mismo orden.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {PASOS_RECORRIDO_PRINCIPAL.map((p) => (
            <Link
              key={p.paso}
              to={p.to}
              className="group flex flex-col rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm transition hover:bg-white/20"
            >
              <span className="text-xs font-bold text-emerald-200">Paso {p.paso}</span>
              <span className="mt-1 font-display text-lg font-semibold text-white">{p.tituloPagina}</span>
              <span className="mt-2 text-xs leading-snug text-emerald-100/90">{p.descripcionBanner}</span>
              <span className="mt-3 text-xs font-semibold text-white underline decoration-white/50 underline-offset-2 group-hover:decoration-white">
                Abrir →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/mi-plan"
            className="rounded-2xl bg-white px-6 py-3 text-sm font-bold text-emerald-900 shadow-lg hover:bg-emerald-50"
          >
            Empezar · Mis datos
          </Link>
          <Link
            to="/keto-mercado"
            className="rounded-2xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15"
          >
            Ir al mercado
          </Link>
          <Link
            to="/cronograma"
            className="rounded-2xl border border-white/25 px-5 py-3 text-sm font-semibold text-emerald-100 hover:text-white"
          >
            Ver menú (cronograma)
          </Link>
        </div>
      </section>

      <FlujoUsuarioBanner />

      <section>
        <h2 className="font-display text-lg font-semibold text-leaf-900">Todo en la app</h2>
        <p className="mt-1 text-sm text-slate-600">Explora también estas secciones.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              t: "1 · Mis datos",
              d: "Perfil y preferencias alimentarias.",
              to: "/mi-plan"
            },
            {
              t: "2 · Mercado keto",
              d: "Lista, checklist y guardado para el plan.",
              to: "/keto-mercado"
            },
            {
              t: "3 · Cronograma",
              d: "Plantillas o IA; video por receta.",
              to: "/cronograma"
            },
            {
              t: "Belleza natural",
              d: "Tips caseros (fuera del flujo de menú).",
              to: "/belleza"
            }
          ].map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="rounded-2xl border border-leaf-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <h3 className="font-display text-base font-semibold text-leaf-900">{c.t}</h3>
              <p className="mt-2 text-sm text-slate-600">{c.d}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-emerald-800">Abrir →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
