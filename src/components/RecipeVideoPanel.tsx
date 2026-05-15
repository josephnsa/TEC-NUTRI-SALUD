import { useEffect, useState } from "react";
import type { PlatoReceta } from "../lib/nutritionPlan";
import { asegurarVideoEmbebible, buscarVideoParaReceta, fuentesBusquedaVideo } from "../lib/recipeVideoResolve";
import { busquedaVideoRecetaHref, urlReproducibleDesdePlato } from "../lib/recipeVideoUrl";
import { RecipeVideoEmbedSafe } from "./RecipeVideoEmbed";

type Props = {
  plato: Pick<PlatoReceta, "titulo" | "videoQuery" | "videoUrl" | "youtubeVideoId">;
  dietaHint?: string;
};

/**
 * Busca un tutorial y lo muestra embebido en la página (iframe YouTube / react-player).
 */
export function RecipeVideoPanel({ plato, dietaHint }: Props) {
  const busquedaHref = busquedaVideoRecetaHref(
    plato.titulo,
    dietaHint ? `${plato.videoQuery} ${dietaHint}` : plato.videoQuery
  );

  const [playUrl, setPlayUrl] = useState<string | null>(() => urlReproducibleDesdePlato(plato));
  const [urlValidada, setUrlValidada] = useState(() => Boolean(urlReproducibleDesdePlato(plato)));
  const [buscando, setBuscando] = useState(() => !urlReproducibleDesdePlato(plato));
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolver = async () => {
      const directo = urlReproducibleDesdePlato(plato);
      if (directo) {
        setBuscando(true);
        const ok = await asegurarVideoEmbebible(directo);
        if (cancelled) return;
        if (ok) {
          setPlayUrl(ok);
          setUrlValidada(true);
          setAviso(null);
          setBuscando(false);
          return;
        }
      }

      setBuscando(true);
      setPlayUrl(null);
      setUrlValidada(false);
      let url: string | null = null;
      try {
        url = await buscarVideoParaReceta(plato.titulo, plato.videoQuery);
      } catch (e) {
        if (cancelled) return;
        setBuscando(false);
        if (e instanceof Error && e.message === "GEMINI_QUOTA") {
          setAviso(
            "Cuota gratuita de Gemini agotada por hoy. Espera unas horas, añade VITE_YOUTUBE_API_KEY en el build, o abre el enlace de búsqueda."
          );
          return;
        }
        throw e;
      }
      if (cancelled) return;
      setBuscando(false);
      if (url) {
        setPlayUrl(url);
        setUrlValidada(true);
        setAviso(null);
      } else {
        const { youtubeApi, gemini } = fuentesBusquedaVideo();
        const sinFuentes = !youtubeApi && !gemini;
        setAviso(
          sinFuentes
            ? "Para reproducir vídeos aquí, el build debe incluir VITE_GEMINI_API_KEY o VITE_YOUTUBE_API_KEY (GitHub Secrets + nuevo deploy)."
            : "No encontramos un vídeo embebible para este plato. Si Gemini está activo, puede ser cuota diaria agotada."
        );
      }
    };

    void resolver();
    return () => {
      cancelled = true;
    };
  }, [plato.titulo, plato.videoQuery, plato.videoUrl, plato.youtubeVideoId]);

  if (buscando) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-slate-50/90">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" aria-hidden />
        <span className="text-[11px] font-medium text-teal-800">Buscando vídeo de la receta…</span>
        <span className="max-w-[240px] text-center text-[10px] text-slate-500">{plato.titulo}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {aviso && (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-2 py-1.5 text-[10px] text-amber-950" role="status">
          {aviso}
        </p>
      )}
      <RecipeVideoEmbedSafe
        playUrl={playUrl}
        videoId={plato.youtubeVideoId ?? undefined}
        title={plato.titulo}
        searchFallbackHref={busquedaHref}
        urlYaValidada={urlValidada && Boolean(playUrl)}
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
