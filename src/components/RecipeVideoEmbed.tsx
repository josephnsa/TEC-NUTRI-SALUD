import { useState } from "react";
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
