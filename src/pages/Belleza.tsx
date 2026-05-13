import { ORDEN_CATEGORIAS, beautyTips } from "../data/beautyTips";

export function Belleza() {
  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-leaf-900 sm:text-3xl">Belleza natural</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-700">
          Tips caseros por tema. Si tienes alergias o piel sensible, prueba en una zona pequeña.
        </p>
      </header>

      {ORDEN_CATEGORIAS.map((cat) => {
        const tips = beautyTips.filter((t) => t.categoria === cat.id);
        if (!tips.length) return null;
        return (
          <section
            key={cat.id}
            className="scroll-mt-4 rounded-3xl border border-leaf-100 bg-gradient-to-b from-white to-leaf-50/30 p-5 shadow-sm sm:p-6"
            aria-labelledby={`belleza-${cat.id}`}
          >
            <h2 id={`belleza-${cat.id}`} className="font-display text-xl font-semibold text-leaf-900">
              {cat.titulo}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{cat.intro}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {tips.map((tip) => (
                <article
                  key={tip.id}
                  className="rounded-2xl border border-leaf-100/80 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                >
                  <h3 className="font-display text-lg font-semibold text-leaf-900">{tip.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{tip.descripcion}</p>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {tip.ingredientes.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                  {tip.precaucion && (
                    <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-950">{tip.precaucion}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
