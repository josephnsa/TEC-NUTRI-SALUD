import { Component, lazy, Suspense, useState, type ErrorInfo, type ReactNode } from "react";
import {
  busquedaVideoRecetaHref,
  detectRecipeVideoPlatform,
  etiquetaPlataformaVideo,
  urlReproducibleReceta
} from "../lib/recipeVideoUrl";

const ReactPlayer = lazy(() => import("react-player"));

type Props = {
  /** URL completa (YouTube, TikTok, Vimeo, etc.) o ID YouTube legacy. */
  playUrl?: string | null;
  /** @deprecated Usar playUrl; se acepta por compatibilidad. */
  videoId?: string;
  title: string;
  searchFallbackHref?: string;
};

function VideoFallbackCard({ title, searchFallbackHref }: { title: string; searchFallbackHref?: string }) {
  const href = searchFallbackHref ?? busquedaVideoRecetaHref(title);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="motion-safe:hover:border-teal-400/70 motion-safe:hover:shadow-md flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-teal-300/80 bg-gradient-to-br from-teal-50 via-white to-violet-50/35 px-5 text-center text-teal-900 shadow-inner transition motion-safe:duration-150"
    >
      <span className="text-4xl">▶</span>
      <span className="text-sm font-semibold">Ver receta en vídeo</span>
      <span className="text-[11px] text-teal-700/85">
        {title ? `"${title}"` : "Receta"} · YouTube, TikTok u otra plataforma
      </span>
    </a>
  );
}

function PlayerInner({
  src,
  title,
  searchFallbackHref,
  onFail
}: {
  src: string;
  title: string;
  searchFallbackHref?: string;
  onFail: () => void;
}) {
  const platform = detectRecipeVideoPlatform(src);

  return (
    <div className="motion-safe:animate-fade-up relative aspect-video w-full overflow-hidden rounded-xl border border-emerald-100 bg-black/5 shadow-inner">
      <ReactPlayer
        src={src}
        controls
        width="100%"
        height="100%"
        style={{ width: "100%", height: "100%", aspectRatio: "16 / 9" }}
        playsInline
        onError={() => onFail()}
      />
      <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white">
        {etiquetaPlataformaVideo(platform)}
      </span>
      <a
        href={searchFallbackHref ?? busquedaVideoRecetaHref(title)}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 rounded-lg bg-black/55 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm hover:bg-black/70"
      >
        Abrir en {etiquetaPlataformaVideo(platform)}
      </a>
    </div>
  );
}

export function RecipeVideoEmbed({ playUrl, videoId, title, searchFallbackHref }: Props) {
  const [failed, setFailed] = useState(false);
  const resolved =
    (playUrl ? urlReproducibleReceta(playUrl) : null) ??
    (videoId ? urlReproducibleReceta(videoId) : null);

  if (!resolved || failed) {
    return <VideoFallbackCard title={title} searchFallbackHref={searchFallbackHref} />;
  }

  return (
    <Suspense
      fallback={
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-emerald-100 bg-slate-50/80">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-300 border-t-transparent" />
            <span className="text-[11px]">Cargando reproductor…</span>
          </div>
        </div>
      }
    >
      <PlayerInner
        src={resolved}
        title={title}
        searchFallbackHref={searchFallbackHref}
        onFail={() => setFailed(true)}
      />
    </Suspense>
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
    /* Silencioso en producción */
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <p className="rounded-lg border border-amber-200/90 bg-amber-50/95 px-2 py-2 text-xs text-amber-950">
            No se pudo mostrar el reproductor. Usa el enlace «Ver receta en vídeo».
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
      fallback={<VideoFallbackCard title={props.title} searchFallbackHref={props.searchFallbackHref} />}
    >
      <RecipeVideoEmbed {...props} />
    </RecipeEmbedErrorBoundary>
  );
}
