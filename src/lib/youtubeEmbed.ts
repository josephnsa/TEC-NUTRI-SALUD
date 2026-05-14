/** Extrae ID de video (11 caracteres) de URL o texto con URL de YouTube. */
export function youtubeVideoIdFromInput(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const vParam = s.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (vParam?.[1]) return vParam[1];
  const shortOnly = s.match(/^([a-zA-Z0-9_-]{11})$/);
  return shortOnly?.[1] ?? null;
}

export function youtubeNocookieEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
}
