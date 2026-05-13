import { beautyTips } from "../data/beautyTips";

export function Belleza() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-leaf-900">Tips de belleza naturales</h1>
        <p className="mt-1 text-sm text-slate-600">
          Recetas caseras suaves. Si tienes alergias, prueba en una zona pequeña antes.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {beautyTips.map((tip) => (
          <article key={tip.id} className="rounded-2xl border border-leaf-100 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-leaf-900">{tip.titulo}</h2>
            <p className="mt-2 text-sm text-slate-700">{tip.descripcion}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {tip.ingredientes.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            {tip.precaucion && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">{tip.precaucion}</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
