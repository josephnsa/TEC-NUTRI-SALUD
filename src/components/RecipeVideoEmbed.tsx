import { Component, lazy, Suspense, useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import {
  busquedaVideoRecetaHref,
  detectRecipeVideoPlatform,
  etiquetaPlataformaVideo,
  urlReproducibleReceta
} from "../lib/recipeVideoUrl";
import { asegurarVideoEmbebible } from "../lib/recipeVideoResolve";
import { youtubeNocookieEmbedUrl, youtubeVideoIdFromInput } from "../lib/youtubeEmbed";

const ReactPlayer = lazy(() => import("react-player"));

type Props = {
  playUrl?: string | null;
  videoId?: string;
  title: string;
  searchFallbackHref?: string;
  /** Si el panel ya validó la URL, no repetir comprobaciones (evita caer al enlace externo). */
  urlYaValidada?: boolean;
};

function VideoFallbackCard({
  title,
  searchFallbackHref,
  detalle
}: {
  title: string;
  searchFallbackHref?: string;
  detalle?: string;
}) {
  const href = searchFallbackHref ?? busquedaVideoRecetaHref(title);

  return (
    <div className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-3 text-xs text-amber-950">
      <p className="font-medium">{detalle ?? "No se pudo cargar el vídeo en esta página."}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 font-semibold text-teal-800 underline-offset-2 hover:underline"
      >
        Buscar en YouTube ↗
      </a>
    </div>
  );
}

function YoutubeIframePlayer({ videoId, title }: { videoId: string; title: string }) {
  const src = `${youtubeNocookieEmbedUrl(videoId)}?rel=0&modestbranding=1&playsinline=1`;
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-emerald-100 bg-black shadow-inner">
      <iframe
        className="h-full w-full"
        src={src}
        title={`Vídeo: ${title}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white">
        YouTube
      </span>
    </div>
  );
}

function PlayerInner({
  src,
  onReady,
  onFail
}: {
  src: string;
  onReady: () => void;
  onFail: () => void;
}) {
  const platform = detectRecipeVideoPlatform(src);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-emerald-100 bg-black/5 shadow-inner">
      <ReactPlayer
        src={src}
        controls
        width="100%"
        height="100%"
        style={{ width: "100%", height: "100%", aspectRatio: "16 / 9" }}
        playsInline
        onReady={onReady}
        onError={() => onFail()}
      />
      <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white">
        {etiquetaPlataformaVideo(platform)}
      </span>
    </div>
  );
}

export function RecipeVideoEmbed({ playUrl, videoId, title, searchFallbackHref, urlYaValidada }: Props) {
  const raw =
    (playUrl ? urlReproducibleReceta(playUrl) : null) ??
    (videoId ? urlReproducibleReceta(videoId) : null);

  const ytId = raw ? youtubeVideoIdFromInput(raw) : null;

  const [validando, setValidando] = useState(Boolean(raw && !urlYaValidada));
  const [srcValidado, setSrcValidado] = useState<string | null>(urlYaValidada && raw ? raw : null);
  const [falloPlayer, setFalloPlayer] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!raw) {
      setValidando(false);
      setSrcValidado(null);
      return;
    }

    if (urlYaValidada) {
      setValidando(false);
      setSrcValidado(raw);
      setFalloPlayer(false);
      setListo(false);
      return;
    }

    let cancelled = false;
    setValidando(true);
    setSrcValidado(null);
    setFalloPlayer(false);
    setListo(false);

    void asegurarVideoEmbebible(raw).then((ok) => {
      if (cancelled) return;
      setValidando(false);
      setSrcValidado(ok);
    });

    return () => {
      cancelled = true;
    };
  }, [raw, urlYaValidada]);

  if (validando) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-slate-50/90">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
        <span className="text-[11px] font-medium text-teal-800">Comprobando que el vídeo se reproduce…</span>
      </div>
    );
  }

  if (!srcValidado || falloPlayer) {
    return (
      <VideoFallbackCard
        title={title}
        searchFallbackHref={searchFallbackHref}
        detalle={
          raw
            ? "El vídeo no pudo reproducirse aquí. Prueba otro enlace abajo."
            : "Aún no hay vídeo para este plato."
        }
      />
    );
  }

  if (ytId && detectRecipeVideoPlatform(srcValidado) === "youtube") {
    return (
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-emerald-700" role="status">
          Reproduce el tutorial aquí ↓
        </p>
        <YoutubeIframePlayer videoId={ytId} title={title} />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {listo && (
        <p className="text-[10px] font-medium text-emerald-700" role="status">
          ✓ Vídeo listo — reprodúcelo aquí
        </p>
      )}
      <Suspense
        fallback={
          <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-emerald-100 bg-slate-50/80">
            <span className="text-[11px] text-slate-500">Cargando reproductor…</span>
          </div>
        }
      >
        <PlayerInner src={srcValidado} onReady={() => setListo(true)} onFail={() => setFalloPlayer(true)} />
      </Suspense>
    </div>
  );
}

export class RecipeEmbedErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(_error: unknown, _info: ErrorInfo) {
    /* Silencioso */
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <p className="rounded-lg border border-amber-200/90 bg-amber-50/95 px-2 py-2 text-xs text-amber-950">
            No se pudo mostrar el reproductor.
          </p>
        )
      );
    }
    return this.props.children;
  }
}

export function RecipeVideoEmbedSafe(props: Props) {
  return (
    <RecipeEmbedErrorBoundary
      fallback={
        <VideoFallbackCard title={props.title} searchFallbackHref={props.searchFallbackHref} />
      }
    >
      <RecipeVideoEmbed {...props} />
    </RecipeEmbedErrorBoundary>
  );
}
