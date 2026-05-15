import { Component, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { miniaturaYoutubeCarga, youtubeNocookieEmbedUrl } from "../lib/youtubeEmbed";

type Props = {
  videoId: string;
  title: string;
  /** URL de fallback para abrir búsqueda en YouTube cuando el embed falla. */
  searchFallbackHref?: string;
};

type VideoState = "checking" | "ready" | "error";

/** Botón-tarjeta de fallback: lleva a la búsqueda en YouTube en nueva pestaña. */
function VideoFallbackCard({ title, searchFallbackHref }: { title: string; searchFallbackHref?: string }) {
  const href =
    searchFallbackHref ??
    `https://www.youtube.com/results?search_query=${encodeURIComponent(`receta ${title} español`)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="motion-safe:hover:border-teal-400/70 motion-safe:hover:shadow-md flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-teal-300/80 bg-gradient-to-br from-teal-50 via-white to-violet-50/35 px-5 text-center text-teal-900 shadow-inner transition motion-safe:duration-150"
    >
      <span className="text-4xl">▶</span>
      <span className="text-sm font-semibold">Ver receta en YouTube</span>
      <span className="text-[11px] text-teal-700/85">
        {title ? `"${title}"` : "Receta"} · abre YouTube en nueva pestaña
      </span>
    </a>
  );
}

export function RecipeVideoEmbed({ videoId, title, searchFallbackHref }: Props) {
  const [estado, setEstado] = useState<VideoState>("checking");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 1. Validar que el video existe comprobando si carga la miniatura
  useEffect(() => {
    let cancelled = false;
    setEstado("checking");
    void miniaturaYoutubeCarga(videoId).then((ok) => {
      if (!cancelled) setEstado(ok ? "ready" : "error");
    });
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  // 2. Detectar errores del iframe mediante postMessage de YouTube
  //    Códigos 100 = video no encontrado, 101/150 = embedding no permitido por el autor
  useEffect(() => {
    if (estado !== "ready") return;

    const handler = (e: MessageEvent) => {
      if (!e.origin.includes("youtube")) return;
      // Filtrar al iframe específico de esta instancia
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;
      try {
        const data = (typeof e.data === "string" ? JSON.parse(e.data) : e.data) as unknown;
        if (data && typeof data === "object" && "event" in data) {
          const d = data as { event?: string; info?: unknown };
          if (d.event === "onError") {
            setEstado("error");
          }
        }
      } catch {
        // Ignorar mensajes que no sean JSON o no sean del player
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [estado]);

  if (estado === "checking") {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-emerald-100 bg-slate-50/80">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-300 border-t-transparent" />
          <span className="text-[11px]">Verificando video…</span>
        </div>
      </div>
    );
  }

  if (estado === "error") {
    return <VideoFallbackCard title={title} searchFallbackHref={searchFallbackHref} />;
  }

  // Añadir enablejsapi=1 para que YouTube emita postMessage de errores
  const src = `${youtubeNocookieEmbedUrl(videoId)}?enablejsapi=1`;

  return (
    <div className="motion-safe:animate-fade-up relative aspect-video w-full overflow-hidden rounded-xl border border-emerald-100 bg-black/5 shadow-inner">
      <iframe
        ref={iframeRef}
        title={title ? `Video — ${title}` : "Video de receta"}
        src={src}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        loading="lazy"
        onError={() => setEstado("error")}
      />
    </div>
  );
}

/** Atrapa fallos de render en el hijo (poco frecuentes en iframe); mantiene enlace fuera como respaldo en el padre. */
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
            No se pudo mostrar el reproductor. Usa «Ver en YouTube» debajo.
          </p>
        )
      );
    }
    return this.props.children;
  }
}

/** Embed con boundary integrada y fallback de búsqueda para el modal del día. */
export function RecipeVideoEmbedSafe(props: Props) {
  return (
    <RecipeEmbedErrorBoundary fallback={<VideoFallbackCard title={props.title} searchFallbackHref={props.searchFallbackHref} />}>
      <RecipeVideoEmbed {...props} />
    </RecipeEmbedErrorBoundary>
  );
}
