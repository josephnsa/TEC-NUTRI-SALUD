import { ORDEN_CATEGORIAS, beautyTips } from "../data/beautyTips";
import { TutorialVideoPanel } from "../components/TutorialVideoPanel";

function scrollACategoria(id: string) {
  const el = document.getElementById(`sec-belleza-${id}`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Belleza() {
  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-teal-950 sm:text-3xl">Belleza natural</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-700">
          Tips caseros por tema con vídeo tutorial integrado cuando hay coincidencia. Si tienes alergias o
          piel sensible, prueba en una zona pequeña.
        </p>
      </header>

      <nav
        className="sticky top-[3.4rem] z-30 -mx-3 overflow-x-auto border-b border-emerald-100/80 bg-white/85 px-3 py-2 backdrop-blur-xl sm:-mx-4 sm:px-4"
        aria-label="Categorías de belleza"
      >
        <div className="flex min-w-max gap-2">
          {ORDEN_CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => scrollACategoria(cat.id)}
              className="rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-teal-900 shadow-sm transition hover:border-teal-300 hover:bg-teal-50/80 whitespace-nowrap"
            >
              {cat.titulo}
            </button>
          ))}
        </div>
      </nav>

      {ORDEN_CATEGORIAS.map((cat) => {
        const tips = beautyTips.filter((t) => t.categoria === cat.id);
        if (!tips.length) return null;
        return (
          <section
            key={cat.id}
            id={`sec-belleza-${cat.id}`}
            className="ui-card-muted scroll-mt-24 sm:p-6"
            aria-labelledby={`lbl-belleza-${cat.id}`}
          >
            <h2 id={`lbl-belleza-${cat.id}`} className="ui-section-title text-gradient-brand">
              {cat.titulo}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{cat.intro}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {tips.map((tip) => (
                <article
                  key={tip.id}
                  className="ui-meal-slot transition motion-safe:hover:border-teal-200/80 motion-safe:hover:shadow-md"
                >
                  <h3 className="font-display text-lg font-semibold text-teal-950">{tip.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{tip.descripcion}</p>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {tip.ingredientes.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                  {tip.precaucion && (
                    <p className="mt-3 rounded-xl border border-amber-200/70 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 shadow-sm backdrop-blur-sm">
                      {tip.precaucion}
                    </p>
                  )}
                  <div className="mt-4 space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-800">
                      Video tutorial
                    </p>
                    <TutorialVideoPanel
                      source={{
                        titulo: tip.titulo,
                        videoQuery: tip.videoQuery
                      }}
                      contexto="belleza"
                      sinVideoLabel="este tip"
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
