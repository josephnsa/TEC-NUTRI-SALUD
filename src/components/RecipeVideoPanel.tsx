import { useEffect, useState } from "react";
import type { PlatoReceta } from "../lib/nutritionPlan";
import { buscarVideoParaReceta } from "../lib/recipeVideoResolve";
import { busquedaVideoRecetaHref, urlReproducibleDesdePlato } from "../lib/recipeVideoUrl";
import { RecipeVideoEmbedSafe } from "./RecipeVideoEmbed";

type Props = {
  plato: Pick<PlatoReceta, "titulo" | "videoQuery" | "videoUrl" | "youtubeVideoId">;
  dietaHint?: string;
};

/**
 * Muestra el reproductor embebido: usa URL guardada o busca automáticamente un tutorial.
 */
export function RecipeVideoPanel({ plato, dietaHint }: Props) {
  const busquedaHref = busquedaVideoRecetaHref(
    plato.titulo,
    dietaHint ? `${plato.videoQuery} ${dietaHint}` : plato.videoQuery
  );

  const [playUrl, setPlayUrl] = useState<string | null>(() => urlReproducibleDesdePlato(plato));
  const [buscando, setBuscando] = useState(() => !urlReproducibleDesdePlato(plato));
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    const directo = urlReproducibleDesdePlato(plato);
    if (directo) {
      setPlayUrl(directo);
      setBuscando(false);
      setAviso(null);
      return;
    }

    let cancelled = false;
    setBuscando(true);
    setPlayUrl(null);
    setAviso(null);

    void buscarVideoParaReceta(plato.titulo, plato.videoQuery).then((url) => {
      if (cancelled) return;
      setBuscando(false);
      if (url) {
        setPlayUrl(url);
        setAviso("Vídeo encontrado automáticamente para esta receta.");
      } else {
        setAviso("No se encontró un vídeo embebible. Usa el enlace de búsqueda.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [plato.titulo, plato.videoQuery, plato.videoUrl, plato.youtubeVideoId]);

  if (buscando) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-slate-50/90">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
        <span className="text-[11px] font-medium text-teal-800">Buscando vídeo de la receta…</span>
        <span className="max-w-[240px] text-center text-[10px] text-slate-500">{plato.titulo}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {aviso && (
        <p className="text-[10px] text-teal-800/90" role="status">
          {aviso}
        </p>
      )}
      <RecipeVideoEmbedSafe
        playUrl={playUrl}
        videoId={plato.youtubeVideoId ?? undefined}
        title={plato.titulo}
        searchFallbackHref={busquedaHref}
      />
      <a
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-teal-700 underline-offset-2 hover:underline"
        href={busquedaHref}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>↗</span> Buscar otro vídeo en la web
      </a>
    </div>
  );
}
