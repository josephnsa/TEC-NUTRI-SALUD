import { useEffect, useState } from "react";
import {
  asegurarVideoEmbebible,
  buscarVideoEmbeddible,
  fuentesBusquedaVideo
} from "../lib/recipeVideoResolve";
import {
  busquedaVideoHref,
  type VideoBusquedaContexto,
  urlReproducibleDesdePlato
} from "../lib/recipeVideoUrl";
import { RecipeVideoEmbedSafe } from "./RecipeVideoEmbed";

export type TutorialVideoSource = {
  titulo: string;
  videoQuery?: string;
  videoUrl?: string | null;
  youtubeVideoId?: string | null;
};

type Props = {
  source: TutorialVideoSource;
  contexto?: VideoBusquedaContexto;
  queryExtra?: string;
  loadingLabel?: string;
  sinVideoLabel?: string;
};

function queryCombinada(source: TutorialVideoSource, queryExtra?: string): string | undefined {
  const base = (source.videoQuery ?? "").trim();
  const extra = (queryExtra ?? "").trim();
  const merged = `${base} ${extra}`.replace(/\s+/g, " ").trim();
  return merged || undefined;
}

export function TutorialVideoPanel({
  source,
  contexto = "receta",
  queryExtra,
  loadingLabel,
  sinVideoLabel
}: Props) {
  const videoQuery = queryCombinada(source, queryExtra);
  const busquedaHref = busquedaVideoHref(source.titulo, videoQuery, contexto);
  const platoLike = {
    videoUrl: source.videoUrl,
    youtubeVideoId: source.youtubeVideoId
  };

  const [playUrl, setPlayUrl] = useState<string | null>(() => urlReproducibleDesdePlato(platoLike));
  const [urlValidada, setUrlValidada] = useState(() => Boolean(urlReproducibleDesdePlato(platoLike)));
  const [buscando, setBuscando] = useState(() => !urlReproducibleDesdePlato(platoLike));
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolver = async () => {
      const directo = urlReproducibleDesdePlato(platoLike);
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
        url = await buscarVideoEmbeddible(source.titulo, videoQuery, contexto);
      } catch (e) {
        if (cancelled) return;
        setBuscando(false);
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
        const item =
          contexto === "belleza"
            ? sinVideoLabel ?? "este tip"
            : sinVideoLabel ?? "este plato";
        setAviso(
          sinFuentes
            ? "Para reproducir vídeos aquí, el build debe incluir VITE_GEMINI_API_KEY o VITE_YOUTUBE_API_KEY (GitHub Secrets + nuevo deploy)."
            : youtubeApi
              ? `No encontramos un vídeo embebible para ${item}. Prueba el enlace de búsqueda abajo.`
              : `No encontramos un vídeo embebible para ${item}. Si solo usas Gemini, puede ser cuota diaria agotada.`
        );
      }
    };

    void resolver();
    return () => {
      cancelled = true;
    };
  }, [source.titulo, source.videoQuery, source.videoUrl, source.youtubeVideoId, videoQuery, contexto]);

  const buscandoTexto =
    loadingLabel ??
    (contexto === "belleza" ? "Buscando vídeo del tip…" : "Buscando vídeo de la receta…");

  if (buscando) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-slate-50/90">
        <div
          className="h-7 w-7 animate-spin rounded-full border-2 border-teal-400 border-t-transparent"
          aria-hidden
        />
        <span className="text-[11px] font-medium text-teal-800">{buscandoTexto}</span>
        <span className="max-w-[240px] text-center text-[10px] text-slate-500">{source.titulo}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {aviso && (
        <p
          className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-2 py-1.5 text-[10px] text-amber-950"
          role="status"
        >
          {aviso}
        </p>
      )}
      <RecipeVideoEmbedSafe
        playUrl={playUrl}
        videoId={source.youtubeVideoId ?? undefined}
        title={source.titulo}
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
