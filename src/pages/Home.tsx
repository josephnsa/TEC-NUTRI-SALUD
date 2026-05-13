import { Link } from "react-router-dom";
import { MARCA_ESLOGAN } from "../lib/brand";
import { PASOS_RECORRIDO_PRINCIPAL, RUTA_MI_ESPACIO } from "../lib/recorrido";

export function Home() {
  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-teal-950 via-emerald-950 to-teal-900 p-6 shadow-xl ring-1 ring-black/10 sm:p-10 md:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200 sm:text-sm">
          Menú claro en tres pasos
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl md:text-[2.35rem]">
          Datos → Mercado → Menú
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-emerald-50 sm:text-base">{MARCA_ESLOGAN}.</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {PASOS_RECORRIDO_PRINCIPAL.map((p) => (
            <Link
              key={p.paso}
              to={p.to}
              className="group flex flex-col rounded-2xl border border-emerald-900/40 bg-white px-4 py-4 text-slate-800 shadow-md transition hover:border-emerald-700/50 hover:shadow-lg"
            >
              <span className="text-xs font-bold uppercase tracking-wide text-emerald-800">Paso {p.paso}</span>
              <span className="mt-1 font-display text-lg font-semibold text-leaf-950">{p.tituloPagina}</span>
              <span className="mt-2 text-xs leading-snug text-slate-600">{p.descripcionBanner}</span>
              <span className="mt-3 text-xs font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-2 group-hover:decoration-emerald-600">
                Ir a esta sección →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/mi-plan"
            className="rounded-2xl bg-white px-6 py-3 text-sm font-bold text-emerald-950 shadow-lg hover:bg-emerald-50"
          >
            Empezar aquí
          </Link>
          <Link
            to="/keto-mercado"
            className="rounded-2xl border border-white/50 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
          >
            Lista de compras
          </Link>
          <Link
            to="/cronograma"
            className="rounded-2xl border border-emerald-400/50 px-5 py-3 text-sm font-semibold text-emerald-50 hover:bg-white/10"
          >
            Cronograma
          </Link>
          <Link
            to={RUTA_MI_ESPACIO}
            className="rounded-2xl border border-white/35 bg-black/15 px-5 py-3 text-sm font-semibold text-emerald-50 hover:bg-black/25"
          >
            Mi resumen
          </Link>
        </div>

        <p className="mt-6 max-w-xl text-xs leading-relaxed text-emerald-200/95">
          La app mejora con el tiempo: mismo orden en móvil y escritorio. Tus datos en este dispositivo se guardan en el
          navegador hasta que los borres.
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-leaf-900">Explora la app</h2>
        <p className="mt-1 text-sm text-slate-600">Accesos directos a cada zona.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              t: "Mis datos",
              d: "Perfil y preferencias.",
              to: "/mi-plan"
            },
            {
              t: "Mercado keto",
              d: "Lista y despensa para el plan.",
              to: "/keto-mercado"
            },
            {
              t: "Cronograma",
              d: "Menú por días e ideas de cocina.",
              to: "/cronograma"
            },
            {
              t: "Mi resumen",
              d: "Qué falta y enlaces rápidos.",
              to: RUTA_MI_ESPACIO
            },
            {
              t: "Belleza natural",
              d: "Tips caseros aparte del menú.",
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
