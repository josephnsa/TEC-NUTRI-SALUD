import { Component, type ErrorInfo, type ReactNode, useState } from "react";
import { youtubeNocookieEmbedUrl } from "../lib/youtubeEmbed";

type Props = {
  videoId: string;
  title: string;
};

export function RecipeVideoEmbed({ videoId, title }: Props) {
  const [broken, setBroken] = useState(false);
  const src = youtubeNocookieEmbedUrl(videoId);
  if (broken) return null;
  return (
    <div className="motion-safe:animate-fade-up relative aspect-video w-full overflow-hidden rounded-xl border border-emerald-100 bg-black/5 shadow-inner">
      <iframe
        title={title ? `Video — ${title}` : "Video de receta"}
        src={src}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        loading="lazy"
        onError={() => setBroken(true)}
      />
    </div>
  );
}

/** Atrapa fallos de render en el hijo (poco frecuentes en iframe); mantiene enlace fuera como respaldo en el padre. */
export class RecipeEmbedErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(_error: unknown, _info: ErrorInfo) {
    /* Depuración: evitar logging en prod salvo herramientas externas */
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="rounded-lg border border-amber-200/90 bg-amber-50/95 px-2 py-2 text-xs text-amber-950">
          No se pudo mostrar el reproductor. Usa «Abrir búsqueda en YouTube» debajo.
        </p>
      );
    }
    return this.props.children;
  }
}

/** Embed con boundary integrada para el modal del día. */
export function RecipeVideoEmbedSafe(props: Props) {
  return (
    <RecipeEmbedErrorBoundary>
      <RecipeVideoEmbed {...props} />
    </RecipeEmbedErrorBoundary>
  );
}
