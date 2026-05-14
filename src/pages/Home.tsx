import { Link } from "react-router-dom";
import { MARCA_ESLOGAN } from "../lib/brand";
import { PASOS_RECORRIDO_PRINCIPAL, RUTA_MI_ESPACIO } from "../lib/recorrido";
import { useAuth } from "../context/AuthContext";

export function Home() {
  const { user, isConfigured } = useAuth();
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-950 via-emerald-900 to-cyan-950 p-6 shadow-glow ring-1 ring-white/10 sm:p-10 md:p-12">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl motion-safe:animate-aurora-soft motion-reduce:opacity-30"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl motion-safe:animate-aurora-soft motion-reduce:opacity-25 [animation-delay:2s]"
          aria-hidden
        />

        <div className="relative z-10 motion-safe:animate-fade-up motion-reduce:animate-none">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/95 sm:text-sm">
            Menú claro en tres pasos
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white drop-shadow-sm sm:text-4xl md:text-[2.45rem]">
            Datos → Mercado → Menú
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-emerald-50 sm:text-base">{MARCA_ESLOGAN}.</p>
        </div>

        <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-3 motion-safe:animate-fade-up-delay motion-reduce:animate-none">
          {PASOS_RECORRIDO_PRINCIPAL.map((p) => (
            <Link
              key={p.paso}
              to={p.to}
              className="group flex flex-col rounded-2xl border border-white/25 bg-white/95 p-4 text-slate-800 shadow-lg shadow-teal-950/20 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-300/60 hover:bg-white hover:shadow-xl motion-reduce:hover:-translate-y-0"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-teal-600">Paso {p.paso}</span>
              <span className="mt-1 font-display text-lg font-semibold text-teal-950">{p.tituloPagina}</span>
              <span className="mt-2 text-xs leading-snug text-slate-600">{p.descripcionBanner}</span>
              <span className="mt-3 text-xs font-semibold text-emerald-700 underline decoration-emerald-300/80 underline-offset-2 transition group-hover:decoration-emerald-600">
                Ir a esta sección →
              </span>
            </Link>
          ))}
        </div>

        <div className="relative z-10 mt-8 flex flex-wrap gap-3 motion-safe:animate-fade-up-delay-2 motion-reduce:animate-none">
          <Link
            to="/mi-plan"
            className="rounded-2xl bg-white px-6 py-3 text-sm font-bold text-teal-900 shadow-lg shadow-black/15 ring-1 ring-white/50 transition motion-safe:hover:scale-[1.02] hover:bg-emerald-50 motion-reduce:hover:scale-100"
          >
            Empezar aquí
          </Link>
          <Link
            to="/keto-mercado"
            className="rounded-2xl border border-white/45 bg-white/15 px-5 py-3 text-sm font-semibold text-white shadow-inner backdrop-blur-md transition hover:bg-white/25"
          >
            Lista de compras
          </Link>
          <Link
            to="/cronograma"
            className="rounded-2xl border border-cyan-300/40 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-500/20"
          >
            Cronograma
          </Link>
          <Link
            to={RUTA_MI_ESPACIO}
            className="rounded-2xl border border-white/30 bg-black/20 px-5 py-3 text-sm font-semibold text-emerald-50 backdrop-blur-sm transition hover:bg-black/30"
          >
            Mi resumen
          </Link>
        </div>

        <p className="relative z-10 mt-6 max-w-xl text-xs leading-relaxed text-emerald-100/90">
          {user && isConfigured ? (
            <>
              <span className="font-semibold text-emerald-300">✓ Sesión activa</span>
              {" — "}perfil sincronizado con Supabase. Mercados, cronogramas y fotos se guardan en este dispositivo; las fotos pueden copiarse a la nube desde el detalle del día.
            </>
          ) : isConfigured ? (
            <>
              Datos guardados en el navegador de este dispositivo.{" "}
              <Link to="/login" className="font-semibold text-emerald-300 underline decoration-emerald-400/60 hover:decoration-emerald-200">
                Inicia sesión
              </Link>{" "}
              para sincronizar el perfil con Supabase.
            </>
          ) : (
            "Datos guardados en el navegador de este dispositivo (sin cuenta, 100 % local)."
          )}
        </p>
      </section>

      <section className="motion-safe:animate-fade-up motion-reduce:animate-none">
        <h2 className="font-display text-xl font-semibold text-gradient-brand">Explora la app</h2>
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
              className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-md shadow-teal-900/5 backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-lg motion-reduce:hover:-translate-y-0"
            >
              <h3 className="font-display text-base font-semibold text-teal-950">{c.t}</h3>
              <p className="mt-2 text-sm text-slate-600">{c.d}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-emerald-700">Abrir →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
