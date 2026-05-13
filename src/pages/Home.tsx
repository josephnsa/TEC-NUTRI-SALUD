import { Link } from "react-router-dom";
import { FlujoUsuarioBanner } from "../components/FlujoUsuarioBanner";

export function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-leaf-700 to-teal-900 p-8 text-white shadow-xl md:p-12">
        <p className="text-sm uppercase tracking-widest text-leaf-100">Salud alimenticia y belleza natural</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight md:text-4xl">
          Tu mercado keto, tu plan y tips naturales en un solo lugar.
        </h1>
        <p className="mt-4 max-w-2xl text-leaf-50">
          Lista por días y comensales, <strong>marca todo de una vez</strong> si compraste la tanda completa, guarda el
          mercado y enlázalo a <strong>Mi plan</strong>: cronograma local o <strong>agente IA gratuito</strong> (Google
          AI Studio / Gemini) y búsqueda de videos. PWA lista para móvil.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/keto-mercado"
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-leaf-900 shadow hover:bg-leaf-50"
          >
            Ir al mercado keto
          </Link>
          <Link
            to="/cronograma"
            className="inline-flex items-center rounded-2xl border border-white/50 bg-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/25"
          >
            Ver cronograma
          </Link>
          <Link
            to="/mi-plan"
            className="rounded-2xl border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Crear mi plan
          </Link>
        </div>
      </section>

      <FlujoUsuarioBanner />

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            t: "Mercado keto inteligente",
            d: "Cantidades orientativas, tildar al comprar o “compré todo de una vez”, historial y respaldo JSON.",
            to: "/keto-mercado"
          },
          {
            t: "Plan según tu perfil",
            d: "Perfil + mercado guardado; cronograma con cantidades ~1 persona y video por receta (plantillas o IA).",
            to: "/mi-plan"
          },
          {
            t: "Cronograma",
            d: "Menú por días, modo perfil/mercado/mixto, agente IA opcional. Se abre al guardar el mercado.",
            to: "/cronograma"
          },
          {
            t: "Belleza natural",
            d: "Mascarillas y rituales caseros con ingredientes simples.",
            to: "/belleza"
          }
        ].map((c) => (
          <Link
            key={c.t}
            to={c.to}
            className="rounded-2xl border border-leaf-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="font-display text-lg font-semibold text-leaf-900">{c.t}</h2>
            <p className="mt-2 text-sm text-slate-600">{c.d}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-leaf-700">Abrir →</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
